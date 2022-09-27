const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
const dbPath = (__dirname, "cricketMatchDetails.db");

let db = null;
app.use(express.json());

const initialDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost/3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initialDbAndServer();

const convertPlayerDetails = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDetails = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//API 1
app.get("/players/", async (request, response) => {
  const getAllPlayersQuery = `
    SELECT *
    FROM player_details;`;
  const getAllPlayersResponse = await db.all(getAllPlayersQuery);
  response.send(
    getAllPlayersResponse.map((eachPlayer) => convertPlayerDetails(eachPlayer))
  );
});

// //API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
  SELECT *
  FROM player_details
  WHERE player_id = ${playerId};`;
  const getPlayerResponse = await db.get(getPlayerQuery);
  response.send(convertPlayerDetails(getPlayerResponse));
});

//API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE player_details
    SET player_name = '${playerName}'
    WHERE player_id = ${playerId};`;
  const updatePlayerResponse = await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT *
    FROM match_details
    WHERE match_id = ${matchId};`;
  const getMatchResponse = await db.get(getMatchQuery);
  response.send(convertMatchDetails(getMatchResponse));
});

//API 5
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchIdQuery = `
  SELECT match_id
  FROM player_match_score
  WHERE player_id = ${playerId};`;
  const getMatchIdResponse = await db.all(getMatchIdQuery);
  const matchIdsArray = getMatchIdResponse.map((eachMatch) => {
    return eachMatch.match_id;
  });
  const getAllMatchesQuery = `
    SELECT *
    FROM match_details
    WHERE match_id in (${matchIdsArray});`;
  const getAllMatchesResponse = await db.all(getAllMatchesQuery);
  response.send(
    getAllMatchesResponse.map((eachMach) => convertMatchDetails(eachMach))
  );
});

//API 6
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayerQuery = `
    SELECT *
    FROM player_match_score
    NATURAL JOIN player_details
    WHERE match_id = ${matchId};`;
  const getMatchPlayerResponse = await db.all(getMatchPlayerQuery);
  response.send(
    getMatchPlayerResponse.map((eachPlayer) => convertPlayerDetails(eachPlayer))
  );
});

const convertPlayerMatchDetails = (playerName, dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: playerName,
    totalScore: dbObject.totalScore,
    totalFours: dbObject.totalFours,
    totalSixes: dbObject.totalSixes,
  };
};

//API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerNameQuery = `
        SELECT player_name
        FROM player_details
        WHERE player_id = ${playerId};`;
  const getPlayerNameResponse = await db.get(getPlayerNameQuery);

  const getStatsQuery = `
        SELECT 
        player_id,
        SUM(score) as totalScore,
        SUM(fours) as totalFours,
        SUM(sixes) as totalSixes
        FROM player_match_score
        WHERE player_id = ${playerId};`;
  const getStatsResponse = await db.get(getStatsQuery);
  response.send(
    convertPlayerMatchDetails(
      getPlayerNameResponse.player_name,
      getStatsResponse
    )
  );
});

module.exports = app;
