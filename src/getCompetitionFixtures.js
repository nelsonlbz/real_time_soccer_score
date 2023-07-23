// * ====== IMPORTS ====== *
const fs = require('fs');

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
const competition = projectConfig['getCompetitionFixtures'].competition;
const season = projectConfig['getCompetitionFixtures'].season;
const timezone = leagueConfig[competition].timezone;
const competition_id = leagueConfig[competition].id;
const competition_type = leagueConfig[competition].type;
const competition_name = leagueConfig[competition].name;
const from_date = leagueConfig[competition].from;
const to_date = leagueConfig[competition].to;

const leagueParams = {
  endpoint: '/leagues',
  querystring: { id: competition_id, season: season, timezone: timezone },
  headers: apiConfig.headers,
};

const fixturesParams = {
  endpoint: '/fixtures',
  querystring: {
    league: competition_id,
    season: season,
    from: from_date,
    to: to_date,
    timezone: timezone,
  },
  headers: apiConfig.headers,
};

const eventsParams = {
  endpoint: '/fixtures/events',
  querystring: { fixture: null },
  headers: apiConfig.headers,
};

const dbParams = {
  dbName: dbConfig.config_db.database,
  username: dbConfig.config_db.username,
  password: dbConfig.config_db.password,
  mydb: leagueConfig[competition].mydb,
  collectionName: leagueConfig[competition].collection,
};

// * ====== FUNCTIONS ====== *
const axios = require('axios');
const { MongoClient } = require('mongodb');

// * ====== FUNCTIONS ====== *
const allFixturesId = [];
const allTeamsId = [];
const allFixtures = [];

const fetchFixtures = (fixturesParams) => {
  return new Promise(async (resolve, reject) => {
    const options = {
      method: 'GET',
      url: `https://api-football-v1.p.rapidapi.com/v3${fixturesParams.endpoint}`,
      params: fixturesParams.querystring,
      headers: fixturesParams.headers,
    };

    try {
      const response = await axios.request(options);
      const data = response.data.response;

      for (let item of data) {
        const fixtureId = item.fixture.id;
        const homeTeamId = item.teams.home.id;
        const homeTeamName = item.teams.home.name;
        const awayTeamName = item.teams.away.name;
        const status = item.fixture.status;

        console.log(
          `Fetch fixtures: Fixture ID: ${fixtureId}, Home Team: ${homeTeamName}, Away Team: ${awayTeamName}, Status: ${status.short}`
        );

        if (!allFixturesId.includes(fixtureId)) {
          allFixturesId.push(fixtureId);
        }

        if (!allTeamsId.includes(homeTeamId)) {
          allTeamsId.push(homeTeamId);
        }

        eventsParams.querystring.fixture = fixtureId;

        const eventsOptions = {
          method: 'GET',
          url: `https://api-football-v1.p.rapidapi.com/v3${eventsParams.endpoint}`,
          params: eventsParams.querystring,
          headers: eventsParams.headers,
        };

        try {
          const eventsResponse = await axios.request(eventsOptions);
          const eventsData = eventsResponse.data.response;
          item.events = eventsData;
          const fixtureDate = new Date(item.fixture.date);
          item.fixture.date = fixtureDate;

          const startCall = new Date(
            fixtureDate.getTime() - 1 * 60 * 60 * 1000
          );
          const endCall = new Date(fixtureDate.getTime() + 3 * 60 * 60 * 1000);

          const now = new Date();
          const nowUTC = new Date(now.toISOString());

          item['api'] = {};
          item['api']['start'] = new Date(startCall.toISOString());
          item['api']['end'] = new Date(endCall.toISOString());
          item['api']['lastUpdate'] = nowUTC;
          allFixtures.push(item);
          console.log(`Events added for fixture ID ${fixtureId}`);
        } catch (eventsError) {
          console.error(eventsError);
        }
      }
      resolve(allFixtures);
      console.log('All fixtures added');
    } catch (error) {
      reject(error);
    }
  });
};

const main = async () => {
  console.log(`Getting all fixtures from ${competition_name}...`);
  const allFixtures = await fetchFixtures(fixturesParams);

  const uri = `mongodb+srv://${dbParams.username}:${dbParams.password}@${dbParams.dbName}.zrhbhxs.mongodb.net/?retryWrites=true&w=majority`;
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  const collection = client
    .db(dbParams.mydb)
    .collection(dbParams.collectionName);

  let upsertedCount = 0;
  let modifiedCount = 0;

  for (const fixture of allFixtures) {
    const filter = { 'fixture.id': fixture.fixture.id };
    const update = { $set: fixture };
    const options = { upsert: true, returnOriginal: false };

    const result = await collection.findOneAndUpdate(filter, update, options);

    if (result.ok) {
      if (result.lastErrorObject.updatedExisting) {
        console.log(`Fixture ID ${fixture.fixture.id} has been updated.`);
        modifiedCount++;
      } else {
        console.log(
          `Fixture ID ${fixture.fixture.id} has been added to the database.`
        );
        upsertedCount++;
      }
    } else {
      console.error(
        `Error updating fixture with ID ${fixture.fixture.id}: ${result.lastErrorObject}`
      );
    }
  }

  console.log(`${upsertedCount} documents were upserted`);
  console.log(`${modifiedCount} documents were updated`);

  await client.close();

  const dataFolderPath = 'data';
  if (!fs.existsSync(dataFolderPath)) {
    fs.mkdirSync(dataFolderPath);
  }

  fs.writeFile(
    `data/allTeamsId_${competition}_${season}.json`,
    JSON.stringify(allTeamsId, null, 2),
    (err) => {
      if (err) {
        console.error('Error writing JSON file:', err);
      } else {
        console.log('allTeamsId.json file has been saved.');
      }
    }
  );
};

main();
