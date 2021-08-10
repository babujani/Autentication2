const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

let dbPath = path.join(__dirname, "userData.db");
let db = null;

const startDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server started at port 3000");
    });
  } catch (err) {
    console.log(`DB Error:${err.message}`);
    process.exit(-1);
  }
};
startDbAndServer();

//register user with min passsword length
app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = ` SELECT * FROM user WHERE username='${username}' ;`;
  const dbUser = await db.get(selectUserQuery);
  if (password.length <= 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    if (dbUser === undefined) {
      const createUserQuery = ` INSERT INTO user (username,name,password,gender,location)
    VALUES ('${username}','${name}','${hashedPassword}','${gender}','${location}') ;`;
      await db.run(createUserQuery);
      response.send("User created successfully");
      response.status(200);
    } else {
      response.status(400);
      response.send("User already exists");
    }
  }
});

//user login
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = ` SELECT * FROM user WHERE username='${username}' ;`;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const checkPassword = await bcrypt.compare(password, dbUser.password);
    if (checkPassword === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//update password
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = ` SELECT * FROM user WHERE username='${username}' ;`;
  const dbUser = await db.get(selectUserQuery);
  const hashNewpassword = await bcrypt.hash(newPassword, 10);
  const checkPassword = await bcrypt.compare(oldPassword, dbUser.password);
  if (checkPassword === true) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const updatePasswordQuery = `UPDATE user SET password='${hashNewpassword} WHERE username='${username}';`;
      await db.run(updatePasswordQuery);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});
module.exports = app;
