# Real Time Soccer Score

## Overview

#### Description

This project is an application that retrieves and updates football match data from an external API. The data is then stored in a MongoDB database. The application is developed using Node.js, Axios for HTTP requests, and MongoDB for data persistence.

#### Objective

The main objective of this project is to provide an automated solution to retrieve live football match data, including scores, statistics, and team line-ups. This data is fetched from an external API that provides real-time information on ongoing and recent matches.

## Files

### 1. getCompetitionFixtures.js

This file fetches and processes fixtures (matches) related to a specific competition. It utilizes the configurations from `apiConfig.json`, `dbConfig.json`, `leagueConfig.json`, and `projectConfig.json`. The fixtures data is fetched from the RapidAPI's `api-football-v1` and stored in a MongoDB collection.

### 2. getCompetitionTeamSquad.js

This file fetches and processes team squads for a specific competition. It uses the configurations from `apiConfig.json`, `dbConfig.json`, `leagueConfig.json`, and `projectConfig.json`. The team squad data is fetched from the RapidAPI's `api-football-v1` and stored in a MongoDB collection.

### 3. getFixturesLiveData.js

This file fetches and processes live data for fixtures scheduled on the current day. It relies on the configurations from `apiConfig.json`, `dbConfig.json`, `leagueConfig.json`, and `projectConfig.json`. The live data for fixtures is fetched from the RapidAPI's `api-football-v1`, and the updated information is stored in a MongoDB collection. The data is continuously updated at a specified frequency.

## Config Files

### 1. `leagueConfig.json`

The `leagueConfig.json` file contains configuration data for various football leagues and tournaments. Each league or tournament is represented by a unique key (e.g., `"wc"` for `World Cup`, `"cl"` for `UEFA Champions League`, etc.), and the corresponding values represent the properties for each league/tournament.

For example, let's consider the entry for LaLiga (ll):

```json
"ll": {
  "id": 140,
  "name": "LaLiga",
  "type": "championnat",
  "country": "spain",
  "from": null,
  "to": null,
  "timezone": "utc",
  "mydb": "test",
  "collection": "ApiChampLiga",
  "collectionSquad": "LigaTeam"
},
```

### 2. `projectConfig.json`

The projectConfig.json file contains configuration data for different tasks or actions that the project needs to perform. It allows you to define the settings for fetching fixtures, team squads, and live data for specific competitions and seasons.

For example:

```json

"getCompetitionFixtures": {
  "competition": "ll",
  "season": 2022
},
```

Sample entry for fetching LaLiga (ll) fixtures for the 2022 season

### 3. API and Database Configuration files

- `apiConfig.json`: contains configurations for accessing the external API.
- `dbConfig.json`: contains configurations for accessing the MongoDB database.

## Features

- **Live Data Retrieval:** The application periodically retrieves live football match data from the external API. The information includes real-time scores, match statistics, and team line-ups.

- **Data Storage in MongoDB:** The retrieved data is stored in a MongoDB database for efficient management and future use.

- **Data Updates:** The application updates existing match data in the database with the latest information from the external API. This ensures that the data remains accurate and up-to-date.

## Prerequisites and Installation

Before you begin, ensure you have the following prerequisites installed on your computer. Follow the steps below to install and set up the application:

#### 1. Install Node.js (version 12 or higher)

- Node.js (https://nodejs.org)

#### 2. Install npm (Node Package Manager) - This comes bundled with Node.js

- MongoDB (https://www.mongodb.com/)

#### 3. Clone the Repository

Start by cloning the Real Time Soccer Score project repository to your local machine. Open your terminal (command prompt for Windows users) and run the following command:

```bash
git clone <repository_url>
```

Replace `<repository_url>` with the URL of the repository. This will create a local copy of the project on your computer.

#### 4. Navigate to the project directory

```bash
cd real_time_soccer_score
```

#### 5. Install the required dependencies by running the following command:

```bash
npm install
```

This will read the `package.json` file and install all the necessary dependencies for the project.

#### 6. Configure API Settings

To make API calls and connect to the MongoDB database, you need to provide your API and database configurations in the following files:

You can obtain your RapidAPI key by signing up for a free account at RapidAPI.
https://rapidapi.com/api-sports/api/api-football

`apiConfig.json`

Open the `config/apiConfig.json` file and replace the empty strings with your RapidAPI key and host:

```json
{
  "headers": {
    "x-rapidapi-key": "YOUR_RAPIDAPI_KEY",
    "x-rapidapi-host": "api-football-v1.p.rapidapi.com"
  }
}
```

#### 7. Configure Database Settings

Please be sure to work with MongoDB as database.

`dbConfig.json`

Open the config/dbConfig.json file and provide your MongoDB database name, username, and password:

```json
{
  "config_db": {
    "database": "YOUR_DATABASE_NAME",
    "password": "YOUR_DATABASE_PASSWORD",
    "username": "YOUR_DATABASE_USERNAME"
  }
}
```

Make sure you have MongoDB installed and running on your computer or provide the details to your hosted MongoDB instance.

#### 8. Customize Project Configuration

The `config/projectConfig.json` file allows you to customize the tasks you want the project to perform. You can define the competitions, seasons, and frequency for live data updates:

```json
{
  "getCompetitionFixtures": {
    "competition": "ll",
    "season": 2022
  },
  "getCompetitionTeamSquad": {
    "competition": "ll",
    "season": 2022
  },
  "getFixturesLiveData": {
    "competition": "pl",
    "season": 2022,
    "frequency": 120000
  }
}
```

In this example, the project will fetch fixtures and team squads for LaLiga (ll) in the 2022 season. Additionally, it will continuously fetch live data for fixtures of the Premier League (pl) every 120,000 milliseconds (2 minutes).

You can find all the competition details for your configuration in the `config/leagueConfig.json` file:

```
{
  "wc": {
    "id": 1,
    "name": "World Cup",
    "type": "tournament",
    "country": "world",
    "from": null,
    "to": null,
    "timezone": "utc",
    "mydb": "test",
    "collection": "ApiTourWorldCup",
    "collectionSquad": "WorldCupTeam"
  },

  "cl": {
    "id": 2,
    "name": "UEFA Champions League",
    "type": "tournament",
    "country": "world",
    "from": "2022-09-01",
    "to": "2023-07-01",
    "timezone": "utc",
    "mydb": "test",
    "collection": "ApiTourChampionsLeague",
    "collectionSquad": "ChampionsLeagueTeam"
  },

  "el": {
    "id": 3,
    "name": "UEFA Europa League",
    "type": "tournament",
    "country": "world",
    "from": "2022-09-01",
    "to": "2023-07-01",
    "timezone": "utc",
    "mydb": "test",
    "collection": "ApiTourEuropaLeague",
    "collectionSquad": "EuropaLeagueTeam"
  },

  "ecl": {
    "id": 848,
    "name": " UEFA Europa Conference League",
    "type": "tournament",
    "country": "world",
    "from": "2022-09-01",
    "to": "2023-07-01",
    "timezone": "utc",
    "mydb": "test",
    "collection": "ApiTourEuropaConfLeague",
    "collectionSquad": "EuropaConfLeagueTeam"
  },

  "ec": {
    "id": 4,
    "name": "UEFA Euro",
    "type": "tournament",
    "country": "world",
    "from": null,
    "to": null,
    "timezone": "utc",
    "mydb": "test",
    "collection": "ApiTourEuro",
    "collectionSquad": "EuroTeam"
  },

  "l1": {
    "id": 61,
    "name": "Ligue 1",
    "type": "championnat",
    "country": "france",
    "from": null,
    "to": null,
    "timezone": "utc",
    "mydb": "test",
    "collection": "ApiChampLigue1",
    "collectionSquad": "Ligue1Team"
  },

  "ll": {
    "id": 140,
    "name": "LaLiga",
    "type": "championnat",
    "country": "spain",
    "from": null,
    "to": null,
    "timezone": "utc",
    "mydb": "test",
    "collection": "ApiChampLiga",
    "collectionSquad": "LigaTeam"
  },

  "pl": {
    "id": 39,
    "name": "Premier League",
    "type": "championnat",
    "country": "england",
    "from": null,
    "to": null,
    "timezone": "utc",
    "mydb": "test",
    "collection": "ApiChampPremierLeague",
    "collectionSquad": "PremierLeagueTeam"
  },

  "sa": {
    "id": 135,
    "name": "Serie A",
    "type": "championnat",
    "country": "italy",
    "from": null,
    "to": null,
    "timezone": "utc",
    "mydb": "test",
    "collection": "ApiChampSerieA",
    "collectionSquad": "SerieATeam"
  },

  "bl": {
    "id": 78,
    "name": "Bundesliga",
    "type": "championnat",
    "country": "germany",
    "from": null,
    "to": null,
    "timezone": "utc",
    "mydb": "test",
    "collection": "ApiChampBundesliga",
    "collectionSquad": "BundesligaTeam"
  },

  "prml": {
    "id": 94,
    "name": "Primeira Liga",
    "type": "championnat",
    "country": "portugal",
    "from": null,
    "to": null,
    "timezone": "utc",
    "mydb": "test",
    "collection": "ApiChampPrimeiraLiga",
    "collectionSquad": "PrimeiraLigaTeam"
  }
}

```

Feel free to add your own competition from here ;) :
https://dashboard.api-football.com/soccer/ids

#### 9. Run the Project

With the configurations set up, you can now run the project. The scripts are located in the src directory. Use the following commands to execute the desired tasks:

```bash
node src/getCompetitionFixtures.js
node src/getCompetitionTeamSquad.js
node src/getFixturesLiveData.js
```

Each script will perform its respective task as specified in the `projectConfig.json` file.

#### 10. Congratulations!

You have successfully installed and set up the Real Time Soccer Score project on your computer. Now you can explore, fetch, and manage football data for various leagues and tournaments. Happy coding!

## Notes

Feel free to further customize this README according to the specifics of your project. You can also add additional instructions, information about dependencies, or other relevant details for project users.

If you have any questions or need further assistance, please let me know!
