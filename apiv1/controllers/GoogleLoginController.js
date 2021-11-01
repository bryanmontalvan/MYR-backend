const { isAdmin, verifyGoogleToken } = require('../authorization/verifyAuth');
const GoogleLoginModel = require('../models/GoogleLoginModel');
const ObjectId = require('mongoose').Types.ObjectId;

function createFilter(params){
    let filter = {};

    if(!params){
        return filter;
    }

    if(params.email){
        filter.email = new RegExp(params.email, 'i');
    }
    if(params._id){
        try{
            filter._id = ObjectId(params._id);
        }catch(err){}
    }
    return filter;
}

module.exports = {
    list: async function(req, resp) {
        let admin = await isAdmin(req.headers['x-access-token']);
        let filter = createFilter(JSON.parse(req.query.filter));
        let range = JSON.parse(req.query.range);

        if(!admin){
            return resp.status(401).json({
                message: "You are not authorized to access this resource",
                error: "Unauthorized"
            });
        }

        let accounts;
        try{
            accounts = await GoogleLoginModel.find(filter).skip(range[1] * (range[0] - 1)).limit(range[1]);
            resp.set('Total-Documents', await GoogleLoginModel.countDocuments(filter));
        }catch(err){
            return resp.status(500).json({
                message: "Error fetching GoogleLogin information",
                error: err
            });
        }

        return resp.status(200).json(accounts);
    },
    
    getByID: async function(req, resp) {
        let admin = await isAdmin(req.headers['x-access-token']);

        if(!admin){
            return resp.status(401).json({
                message: "You are not authorized to access this resource",
                error: "Unauthorized"
            });
        }

        let account;
        try{
            account = await GoogleLoginModel.findById(req.params.id);
        }catch(err){
            return resp.status(500).json({
                message: "Error fetching Google Login Information",
                error: err
            });
        }

        if(!account){
            return resp.status(404).json({
                message: `Account ${req.params.id} does not exist`,
                error: "Not found"
            });
        }

        return resp.status(200).json(account);
    },
    getUserSetting : async function(req,resp){
        console.log("getting settings")
        let uid = req.headers['x-access-token'];
        if(!uid){
            return resp.status(401).json({
                message: "No userID supplied",
                error: "Unauthorized"
            });
        }

        if(uid !== "1"){
            uid = await verifyGoogleToken(req.headers['x-access-token']);
            if(!uid){
                return resp.status(401).json(invalid_token);
            }
        }

        console.log(resp.params);

        let setting; 
        try {
            const user = await GoogleLoginModel.findOne({_id:uid});
            setting = user.userSettings;
        }catch(err){
            return resp.status(500).json({
                message: "Error finding User Setting",
                error: err
            });
        }
        return resp.json(setting);

    },
    updateUserSetting: async function(req,resp){
        let id = req.params.id;
        let body = req.body;

        if(!req.headers['x-access-token']){
            return resp.status(400).json({
                message: "Missing user ID",
                error: "Bad Request"
            });
        }else{
            let uid = await verifyGoogleToken(req.headers['x-access-token']);
            if(!uid){
                return resp.status(401).json({
                    message: "Invalid token recieved",
                    error: "Unauthorized"
                });
            }
        }

        if(Object.keys(body) === 0 || body.settings === undefined){
            return resp.status(400).json({
                message: "Missing required fields",
                error: (Object.keys(body) == 0 ? "No body provided" : "No settings provided")
            });
        }

        let googleId;
        try {
            googleId = await GoogleLoginModel.findByid(id);
        } catch (err) {
            return resp.status(500).json({
                message: "Error getting id",
                error: err
            });
        }

        if(!googleId){
            return resp.status(404).json({
                message: `Could not find googleId "${id}"`,
                error: "Id not found"
            });
        }
        console.log(googleId);
    }
};