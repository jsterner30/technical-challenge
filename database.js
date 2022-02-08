const oracle = require("oracledb")
const AWS = require("aws-sdk")
const functions = require("./lib.js")
const classes = require('./classes.js')
const {WeekCourse} = require("./classes");
const math = require("mathjs");

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
        console.log('It appears you are not connected to AWS CLI. PLease connect and try again')
        process.exit()
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
            console.log('It appears you are not connected to AWS CLI. PLease connect and try again')
            process.exit()
        }
    }
}

async function readDatabase(byuID) {
    let week
    const firstParams = await ssm.getParameters(parameters).promise()
    await setOracleCredentials(firstParams.Parameters[1].Value, firstParams.Parameters[0].Value)
    const conn = await oracle.getConnection(params)
    await conn.execute('SELECT * FROM OIT#JTS234.DOWN_SCHEDULE', async function (err, result) {
        if (err) throw err
        else {
            week = await parseDatabase(result, byuID)
            await printWeek(week)
            return week
        }
    })

}

async function printWeek(week) {
    let size = 3
    let i, j, p
    let width = process.stdout.columns - 10
    let mod = math.floor(width / 7)

    let topChar = '_'
    let sideChar = '|'

    /*for (i = 0; i < size; i++) {
        if (i != size-1) {
            process.stdout.write('\n')
        }
        for (j = 0; j < width; j++) {
            if ((j % mod == 1 && i != 0 && i != size-1) && (j - mod != 0) && (j + mod != width)  || (j == 0 && i !=0 && i != size-1)|| (j == width-1 && i !=0 && i != size-1)) {
                process.stdout.write(sideChar)
            }
            if (i == 0) {
                process.stdout.write(topChar)
                if ((i == 0 ) && (j == width - 10)) {
                    process.stdout.write('________')
                }
            } else {
                process.stdout.write(" ")
            }
        }
    }*/
    size = 10

    for (i = 0; i < size; i++) {
        if (i != 0) {
            process.stdout.write('\n')
        }
        for (j = 0; j < width; j++) {
            if ((j % mod == 1 && i != 0 && i != size-1) && (j - mod != 0) && (j + mod != width)  || (j == 0 && i !=0 && i != size-1)|| (j == width-1 && i !=0 && i != size-1)) {
                process.stdout.write(sideChar)
            }
            if (i == 0 || i == size-1) {
                process.stdout.write(topChar)
                if ((i == 0 || i == size-1) && (j == width - 10)) {
                    process.stdout.write('________')
                }
            } else {
                process.stdout.write(" ")
            }
        }
    }

}


async function parseDatabase(result, byuID) {
    let week = new classes.Week
    let daysArray = []
    for (let i = 0; i < result.rows.length; ++i){
        daysArray = result.rows[i].DAYS.split('')
        let startTime = result.rows[i].START_TIME
        let endTime = result.rows[i].END_TIME
        let building = result.rows[i].BUILDING
        let room = result.rows[i].ROOM
        let className = result.rows[i].CLASS_NAME
        let databaseBYUID = result.rows[i].BYU_ID
        if (byuID == databaseBYUID && startTime!= null) {
        for (let j = 0; j < daysArray.length; j++) {
            switch (daysArray[j]) {
                case '0':
                    week.Monday.push(new WeekCourse(className, building, room, startTime, endTime))
                    break
                case '1':
                    week.Tuesday.push(new classes.WeekCourse(className, building, room, startTime, endTime))
                    break
                case '2':
                    week.Wednesday.push(new classes.WeekCourse(className, building, room, startTime, endTime))
                    break
                case '3':
                    week.Thursday.push(new classes.WeekCourse(className, building, room, startTime, endTime))
                    break
                case '4':
                    week.Friday.push(new classes.WeekCourse(className, building, room, startTime, endTime))
                    break
                case '5':
                    week.Saturday.push(new classes.WeekCourse(className, building, room, startTime, endTime))
                    break
                case '6':
                    week.Sunday.push(new classes.WeekCourse(className, building, room, startTime, endTime))
                    break
            }
        }
        }

    }
    return week
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
module.exports = {testOracleConnectivityAws, getOracleCredentials, writeDatabase, dayNum, readDatabase}