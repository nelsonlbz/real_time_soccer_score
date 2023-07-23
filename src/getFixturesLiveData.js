const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
const axios = require('axios');

// * ====== CONFIG ====== *
console.log('Loading configuration files...');
const apiConfigPath = 'config/apiConfig.json';
const apiConfigJsonData = fs.readFileSync(apiConfigPath, 'utf8');
const apiConfig = JSON.parse(apiConfigJsonData);

const dbConfigfilePath = 'config/dbConfig.json';
const dbConfigJsonData = fs.readFileSync(dbConfigfilePath, 'utf8');
const dbConfig = JSON.parse(dbConfigJsonData);

const leagueConfigPath = 'config/leagueConfig.json';
const leagueConfigJsonData = fs.readFileSync(leagueConfigPath, 'utf8');
const leagueConfig = JSON.parse(leagueConfigJsonData);
console.log('Configuration files loaded.');

const projectConfigPath = 'config/projectConfig.json';
const projectConfigJsonData = fs.readFileSync(projectConfigPath, 'utf8');
const projectConfig = JSON.parse(projectConfigJsonData);

// * ====== PARAMS ====== *
const competition = projectConfig['getFixturesLiveData'].competition;
const season = projectConfig['getFixturesLiveData'].season;
const callFrequency = projectConfig['getFixturesLiveData'].frequency;
const competition_id = leagueConfig[competition].id;
const competition_name = leagueConfig[competition].name;

const todayStart = new Date();
todayStart.setUTCHours(0, 0, 0, 0);

const todayEnd = new Date();
todayEnd.setUTCHours(23, 59, 59, 999);

const dbParams = {
  dbName: dbConfig.config_db.database,
  username: dbConfig.config_db.username,
  password: dbConfig.config_db.password,
  mydb: leagueConfig[competition].mydb,
  collectionName: leagueConfig[competition].collection,
};

const fixturesParams = {
  endpoint: '/fixtures',
  querystring: {
    id: null,
  },
  headers: apiConfig.headers,
};

const url = `mongodb+srv://${dbParams.username}:${dbParams.password}@${dbParams.dbName}.zrhbhxs.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let apiCallCounter = 0;

async function getFixturesToday(client) {
  try {
    console.log(`Getting fixtures for today for ${competition_name}...`);

    console.log("Connecting to MongoDB to fetch today's fixtures...");
    await client.connect();
    const collection = client
      .db(dbParams.mydb)
      .collection(dbParams.collectionName);

    const fixtures = await collection
      .find({
        'fixture.date': {
          $gte: todayStart,
          $lt: todayEnd,
        },
      })
      .toArray();

    console.log("Fetched today's fixtures from MongoDB.");
    console.log(fixtures.length);

    let fixtureApiData = [];

    for (const fixture of fixtures) {
      let fixtureData = {
        id: fixture.fixture.id,
        date: fixture.fixture.date,
        elapsed: fixture.fixture.status.elapsed,
        status: fixture.fixture.status.short,
        api: fixture.api,
      };

      fixtureApiData.push(fixtureData);
    }

    console.log('Processing fixture data...');
    return fixtureApiData;
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

async function main() {
  try {
    let fixtureApiData = await getFixturesToday(client);
    let ongoingFixtures = [];
    let endedFixtures = [];

    setInterval(async () => {
      const now = new Date();
      const nowUTC = new Date(now.toISOString());
      ongoingFixtures = [];
      endedFixtures = [];

      for (const fixture of fixtureApiData) {
        const fixtureOptions = {
          method: 'GET',
          url: `https://api-football-v1.p.rapidapi.com/v3${fixturesParams.endpoint}`,
          params: fixturesParams.querystring,
          headers: fixturesParams.headers,
        };

        fixturesParams.querystring.id = fixture.id;

        if (fixture.api.start < nowUTC && fixture.date > nowUTC) {
          console.log(`Pre-game period just started: ${fixture.id}`);

          try {
            const fixtureResponse = await axios.request(fixtureOptions);
            const fixtureData = fixtureResponse.data.response[0];
            const newFixtureLineUps = fixtureData.lineups;
            apiCallCounter++;

            if (newFixtureLineUps) {
              console.log('Connecting to MongoDB to fetch fixture lineups...');
              await client.connect();
              const collection = client
                .db(dbParams.mydb)
                .collection(dbParams.collectionName);

              const filter = { 'fixture.id': fixture.id };
              const update = {
                $set: {
                  lineups: newFixtureLineUps,
                  'api.lastUpdate': nowUTC,
                },
              };
              const options = { returnOriginal: false };
              const result = await collection.findOneAndUpdate(
                filter,
                update,
                options
              );

              if (result.value) {
                console.log(
                  `Document with fixture.id ${fixture.id} was updated.`
                );
              } else {
                console.log(
                  `No document with fixture.id ${fixture.id} was found.`
                );
              }
            }
          } catch (LineUpsError) {
            console.error(
              `Error fetching fixture line ups for: ${fixture.id}`,
              LineUpsError
            );
          }
        }

        if (fixture.api.end < nowUTC) {
          console.log(`${fixture.id} is over`);
          endedFixtures.push(fixture);
        } else if (fixture.api.start < nowUTC) {
          if (fixture.date < nowUTC) {
            console.log(`${fixture.id} is playing now: ${fixture.elapsed}`);

            try {
              const fixtureResponse = await axios.request(fixtureOptions);
              const fixtureData = fixtureResponse.data.response[0];
              apiCallCounter++;

              const newFixtureStatus = fixtureData.fixture.status;
              const newFixtureGoals = fixtureData.goals;
              const newFixtureScore = fixtureData.score;
              const newFixtureEvents = fixtureData.events;
              const newFixtureStatistics = fixtureData.statistics;
              const newFixturePlayers = fixtureData.players;

              console.log(
                `${fixture.id} score: ${newFixtureGoals.home}-${newFixtureGoals.away}`
              );

              console.log("Connecting to MongoDB to fetch today's fixtures...");
              await client.connect();
              const collection = client
                .db(dbParams.mydb)
                .collection(dbParams.collectionName);

              const filter = { 'fixture.id': fixture.id };
              const update = {
                $set: {
                  'fixture.status': newFixtureStatus,
                  goals: newFixtureGoals,
                  score: newFixtureScore,
                  events: newFixtureEvents,
                  // lineups: newFixtureLineUps,
                  statistics: newFixtureStatistics,
                  players: newFixturePlayers,
                  'api.lastUpdate': nowUTC,
                },
              };
              const options = { returnOriginal: false };
              const result = await collection.findOneAndUpdate(
                filter,
                update,
                options
              );

              if (result.value) {
                console.log(
                  `Document with fixture.id ${fixture.id} was updated.`
                );
              } else {
                console.log(
                  `No document with fixture.id ${fixture.id} was found.`
                );
              }

              fixture.elapsed = newFixtureStatus.elapsed;
              fixture.status = newFixtureStatus.short;

              if (newFixtureStatus.short === 'FT') {
                console.log(
                  `${fixture.id} status is ${newFixtureStatus.short}, we stopped updating the score`
                );
                endedFixtures.push(fixture);
                console.log(
                  `${fixtureApiData.length} fixtures remaining today`
                );
              } else {
                ongoingFixtures.push(fixture);
              }
            } catch (teamError) {
              console.error(
                `Error fetching fixture data for: ${fixture.id}`,
                teamError
              );
              endedFixtures.push(fixture);
            }
          } else if (fixture.elapsed === null) {
            console.log(
              `${fixture.id} will start soon.. ${Math.round(
                (nowUTC - fixture.date) / 60000
              )} minutes`
            );
            ongoingFixtures.push(fixture);
          }
        } else {
          console.log(`${fixture.id} will play today: ${fixture.api.start}`);
          ongoingFixtures.push(fixture);
        }
      }

      fixtureApiData = [...ongoingFixtures];

      console.log('ongoingFixtures:');
      console.log(ongoingFixtures);
      console.log('endedFixtures:');
      console.log(endedFixtures);
      console.log('fixtureApiData:');
      console.log(fixtureApiData);
      endedFixtures.forEach((fixture) => {
        console.log(`Removing fixture ${fixture.id} from the list`);
        fixtureApiData = fixtureApiData.filter((f) => f.id !== fixture.id);
      });
      console.log(`Total API calls made: ${apiCallCounter}`);
    }, callFrequency);
  } catch (error) {
    console.error(error);
  }
}

main();
