const oracle = require("oracledb")
const AWS = require("aws-sdk")
const functions = require("./lib.js")

//Oracle DB Parameters
const params = {
    connectString: 'ora7gdev.byu.edu:1521/cescpy1.byu.edu'
}
oracle.outFormat = oracle.OBJECT;
oracle.autoCommit = true;

//AWS Parameters
let parameters = {
    Names: ['/js-technical-application/dev/USERNAME', '/js-technical-application/dev/PASSWORD'],
    WithDecryption: true
}

//AWS Configuration
AWS.config.update({ region: 'us-west-2'})
const ssm = new AWS.SSM()

//Sets Oracle Params from AWS
const setOracleCredentials = async (username, password) => {
    params.user = username
    params.password = password
}

//Check if user is connected to AWS
const getOracleCredentials = async function () {
    console.log('Testing AWS CLI connection -- please wait')
    try {

        const firstParams = await ssm.getParameters(parameters).promise()
        await setOracleCredentials(firstParams.Parameters[1].Value, firstParams.Parameters[0].Value)
    } catch (err) {
        console.log('It appears you are not connected to AWS CLI. PLease connect and try again')
        process.exit()
    }
}

testOracleConnectivityAws = async function(){
    try {
        console.log('Checking that your VPN is on -- please wait')
        const conn = await oracle.getConnection(params)
        await conn.execute('SELECT * FROM DUAL')
        await conn.close()
    } catch(e) {
        if (e.errorNum  = 12170){
            console.error("It appears you are not connected to your VPN")
            console.error("Please connect to your VPN and try again")
            process.exit()
        }
        else {
            console.log(e)
            throw e
        }
    }
}

async function truncateTable() {
    try {
        const firstParams = await ssm.getParameters(parameters).promise()
        await setOracleCredentials(firstParams.Parameters[1].Value, firstParams.Parameters[0].Value)
        const conn = await oracle.getConnection(params)
        await conn.execute('TRUNCATE TABLE OIT#JTS234.DOWN_SCHEDULE')
        await conn.close()
    }catch (err) {
        throw err
    }
}

async function writeDatabase(studentSchedule, byuID) {
    await truncateTable();
    for (let i = 0; i < studentSchedule.length; i++) {
        let idTime;
        let days = ''
        let fullName = studentSchedule[i].studName
        let startTime = studentSchedule[i].startTime
        let endTime = studentSchedule[i].endTime
        let building = studentSchedule[i].building
        let room = studentSchedule[i].room
        let className = studentSchedule[i].name
        let isOnline = String(studentSchedule[i].online)
        let courseID = studentSchedule[i].id
        for (let j = 0; j < studentSchedule[i].days.length; j++) {
            days = days + dayNum(studentSchedule[i].days[j])

        }
        idTime = byuID + '/'+ days + "/" + startTime
        try {
            const firstParams = await ssm.getParameters(parameters).promise()
            await setOracleCredentials(firstParams.Parameters[1].Value, firstParams.Parameters[0].Value)
            const conn = await oracle.getConnection(params)
            await conn.execute('INSERT INTO OIT#JTS234.DOWN_SCHEDULE (ID_TIME, BYU_ID, FULL_NAME, START_TIME, END_TIME, BUILDING, ROOM, IS_VIRTUAL, CLASS_NAME, COURSE_ID, DAYS)' + 'VALUES (:idTime, :byuID, :fullName, :startTime, :endTime, :building, :room, :isOnline, :className, :courseID, :days)', [idTime, byuID, fullName, startTime, endTime, building, room, isOnline, className, courseID, days])
            await conn.close()
        } catch (err) {
            throw err
        }
    }
}


function dayNum(day) {
    switch (day) {
        case 'M':
            return 0;
        case "T":
            return 1;
        case "W":
            return 2;
        case 'Th':
            return 3;
        case "F":
            return 4;
        case 'S':
            return 5;
        case "Su":
            return 6;
    }
}


//Export Functions
module.exports = {testOracleConnectivityAws, getOracleCredentials, writeDatabase, dayNum}