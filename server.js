const express = require("express");
const path = require("path");
const fs = require("fs");
const db = require("./database.js");
const cors = require("cors");


const corsOptions = {
    origin: "https://hendratanjaya.github.io",
   
};
const app = express();
app.use(cors(corsOptions));
app.use(express.json());
require("dotenv").config();

app.get("/", async (req,res)=>{
    res.send("welcome");
})
app.get("/api/history", async (req,res)=>{

    try {
        let api_key = req.query.API_KEY;
        if(api_key === "-1")
            api_key = generateNewSessionID()

        const {rows} = await db.query("select * from histories where user_id = $1", [api_key]);

        if(rows.length >0){
            res.status(200).json({
                message: "Data fetched successfully!",
                history: rows
            })
        }else{
            try{
                const query = 
                "insert into histories (user_id, game_history) values($1,$2) returning *"

                const newHistory = [];
                const insertRes = await db.query(query, [api_key, JSON.stringify(newHistory)]);

                if(insertRes.rows.length > 0){
                    res.status(201).json({
                        message: "New user added successfully!",
                        api_key: api_key,
                        history: insertRes.rows[0] // Mengirimkan history baru
                    });
                }else{
                    res.status(500).json({ message: "Failed to insert new user into the database" });
                }
            }catch (error) {
                console.error("Error inserting new user:", error);
                res.status(500).json({ message: "Internal server error", error });
            }
        }  
    }
    catch (error){
        console.error("error:",error);
        res.status(500).send(`eror bang: ${error.message}`);
    }
    
});

app.post("/api/add-new-game",async (req,res)=>{

    
    try{
        const api_key = req.query.API_KEY;
        const newHistory = req.body;
        const query = "UPDATE histories SET game_history = game_history || $1 WHERE user_id = $2";
        const { rows } = await db.query(query, [newHistory, api_key]);

        if (rows.length > 0) {
            res.status(200).json({
                message: "Data updated successfully!",
                game_history: rows[0]
            });
        }
    }catch (error){
        console.error("error:",error);
        res.status(500).send(`eror bang: ${error.message}`);
    }
    
    res.json({success:true, message: "Success"});
    
})

app.post("/api/update-history", async (req,res)=>{

    try{
        const api_key = req.query.API_KEY;
        const idx =  req.body.idx;
        const game = req.body.game;
        //console.log(idx);
        const query = `UPDATE histories SET game_history = jsonb_set(game_history, '{${idx}}', $1) WHERE user_id = $2`;

        const result = await db.query(query, [game,api_key]);
        res.status(200).json({message: "Game Updated", result: result});

    }catch (error) {
        console.error("error:",error);
        res.status(500).send(`eror bang: ${error.message}`);
    }
    
   
})



app.listen(3000, ()=>{
    console.log("Server Ready")
})

function generateNewSessionID(){

    const date = new Date();
    const ascii = [[48,57], [65,90], [97,122]];
    let string = "";
    for(let i = 0 ; i < 10; ++i){
      let charType = ascii[Math.floor(Math.random()*3)]                                                        
      let char = String.fromCharCode(Math.floor(Math.random()* (charType[1] - charType[0] + 1) + charType[0]));
      string += char;
    
    }
    const format = ((toFormat, pad)=>{
  
      return String(toFormat).padStart(pad,0);
    })
        
    
    const key = format(date.getDate(),2)+format(date.getSeconds(),2)+format(date.getHours(),2)+format(date.getFullYear(),4)+format(date.getMonth()+1,2)+format(date.getMinutes())+string;
    return key;
  }

  export default app;
