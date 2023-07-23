const axios = require('axios');
const fs = require('fs');
const { MongoClient } = require('mongodb');

// * ====== CONFIG ====== *
const apiConfigPath = 'config/apiConfig.json';
const apiConfigJsonData = fs.readFileSync(apiConfigPath, 'utf8');
const apiConfig = JSON.parse(apiConfigJsonData);

const dbConfigfilePath = 'config/dbConfig.json';
const dbConfigJsonData = fs.readFileSync(dbConfigfilePath, 'utf8');
const dbConfig = JSON.parse(dbConfigJsonData);

const leagueConfigPath = 'config/leagueConfig.json';
const leagueConfigJsonData = fs.readFileSync(leagueConfigPath, 'utf8');
const leagueConfig = JSON.parse(leagueConfigJsonData);

const projectConfigPath = 'config/projectConfig.json';
const projectConfigJsonData = fs.readFileSync(projectConfigPath, 'utf8');
const projectConfig = JSON.parse(projectConfigJsonData);

// * ====== PARAMS ====== *
const competition = projectConfig['getCompetitionTeamSquad'].competition;
const season = projectConfig['getCompetitionTeamSquad'].season;
const competition_name = leagueConfig[competition].name;
const filePath = `data/allTeamsId_${competition}_${season}.json`;

const dbParams = {
  dbName: dbConfig.config_db.database,
  username: dbConfig.config_db.username,
  password: dbConfig.config_db.password,
  mydb: leagueConfig[competition].mydb,
  collectionName: leagueConfig[competition].collectionSquad,
};

const squadParams = {
  endpoint: '/players/squads',
  querystring: { team: null },
  headers: apiConfig.headers,
};

const readJsonFile = (filePath, callback) => {
  console.log(`Reading JSON file from ${filePath}`);
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading JSON file:', err);
      return;
    }
    const AllTeamsId = JSON.parse(data);
    console.log(`JSON data read from ${filePath}:`, AllTeamsId);
    callback(AllTeamsId);
  });
};

const fetchSquads = async (AllTeamsId) => {
  console.log(
    `Fetching ${competition_name} squads for all teams: ${AllTeamsId}`
  );
  const AllTeamSquades = [];

  for (const team of AllTeamsId) {
    squadParams.querystring.team = team;

    console.log(`Fetching squad for team: ${team}`);
    const squadOptions = {
      method: 'GET',
      url: `https://api-football-v1.p.rapidapi.com/v3${squadParams.endpoint}`,
      params: squadParams.querystring,
      headers: squadParams.headers,
    };

    try {
      const squadResponse = await axios.request(squadOptions);
      const squadData = squadResponse.data.response[0];

      const now = new Date();
      const nowUTC = new Date(now.toISOString());

      squadData['api'] = {};
      squadData['api']['lastUpdate'] = nowUTC;
      console.log(`Squad data fetched for team: ${team}`, squadData);

      AllTeamSquades.push(squadData);
      console.log(`Squad ${squadParams.querystring.team} added`);
    } catch (squadError) {
      console.error(`Error fetching squad data for team: ${team}`, squadError);
    }
  }

  console.log('All Team Squads added');
  return AllTeamSquades;
};

const processAllTeamsId = async (AllTeamsId) => {
  const AllTeamSquades = await fetchSquads(AllTeamsId);

  console.log('Connecting to MongoDB Atlas');
  const uri = `mongodb+srv://${dbParams.username}:${dbParams.password}@${dbParams.dbName}.zrhbhxs.mongodb.net/?retryWrites=true&w=majority`;
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await client.connect();
  const collection = client
    .db(dbParams.mydb)
    .collection(dbParams.collectionName);

  await collection.createIndex({ 'team.id': 1 }, { unique: true });

  console.log(
    `Connecting to database: ${dbParams.dbName} collection: ${dbParams.collectionName}`
  );

  try {
    const bulkOps = AllTeamSquades.map((squad) => ({
      updateOne: {
        filter: { 'team.id': squad.team.id },
        update: { $set: squad },
        upsert: true,
      },
    }));

    const result = await collection.bulkWrite(bulkOps);
    console.log(`${result.upsertedCount} documents were upserted`);
    console.log(`${result.modifiedCount} documents were updated`);
  } catch (error) {
    console.error('Error upserting documents: ', error);
  }

  console.log('Closing database connection');
  await client.close();
};

readJsonFile(filePath, processAllTeamsId);
