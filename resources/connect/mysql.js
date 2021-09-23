const con = mysql.createConnection({
    host: "host",
    user: "user",
    password: "password",
    database: "database"
});
con.connect(err => {
    if(err) {
        console.log("[MYSQL]: Database connection failed");
        process.exit();
    }
    else {
        console.log("[MYSQL]: Database connection successfully!");
        loadFromDB();
    }
});
global.con = con;