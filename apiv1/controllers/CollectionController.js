let CollectSchema = require("../models/CollectionModel");
let SceneSchema = require("../models/SceneModel");
let {verifyGoogleToken} = require('../authorization/verifyAuth.js');

const noToken = {
    message: "No token was received",
    error: "Bad Request"
};
const badToken = {
    message: "An invalid token was received",
    error: "Unauthorized"
};

module.exports = {
    list: async function(req, resp) {
        if(!req.headers["x-access-token"]){
            return resp.status(400).json(noToken);
        }
        let uid = await verifyGoogleToken(req.headers["x-access-token"]);

        if(!uid){
            return resp.status(401).json(badToken);
        }
        let collects = undefined;
        try{
            collects = await CollectSchema.find({uid: uid});
        }catch(err){
            return resp.status(500).json({
                message: "Error fetching collections",
                error: err
            });
        }
        if(!collects || collects.length == 0){
            return resp.status(204).send("");
        }
        return resp.status(200).json(collects);
    },
    create: async function(req, resp) {
        if(!req.headers["x-access-token"]){
            return resp.status(400).json(noToken);
        }else if(!req.body.collectID){
            return resp.status(400).json({
                message: "Did not receive field \"collectID\"",
                error: "Bad Request"
            });
        }
        let collectID = req.body.collectID;
        let uid = await verifyGoogleToken(req.headers["x-access-token"]);

        if(!uid){
            return resp.status(401).json(badToken);
        }

        let collects = [];
        try{
            collects = await CollectSchema.find({"collectionID": collectID});
        }catch(err){
            return resp.status(500).json({
                message: "Error fetching collections",
                error: err
            });
        }

        if(collects.length > 0){
            return resp.status(409).json({
                message: `${collectID} already exists as a collection`,
                error: "Conflict"
            });
        }

        try{
            await CollectSchema.create({
                collectionID: collectID,
                uid: uid,
                timestamp: Date.now()
            });
        }catch(err){
            return resp.status(500).json({
                message: `Error creating collection ${collectID}`,
                error: err
            });
        }

        return resp.status(201).json({
            id: collectID
        });
    }
};