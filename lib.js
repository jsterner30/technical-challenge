const axios = require('axios')
const database = require("./database.js")
const classes = require("./classes.js")
const {Building} = require("./classes.js")
const {Room} = require("./classes.js")
const {Course} = require("./classes.js")
const math = require("mathjs")
const datePicker = require('inquirer-datepicker-prompt')
const inquirer = require("inquirer")
const {FreeRoom} = require("./classes");
inquirer.registerPrompt('datetime', datePicker)

let byuID
let token
let regExp = /[a-zA-z]/g;

const buildingOptions = {
    url: 'https://api.byu.edu:443/domains/mobile/location/v2/buildings',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`
    }
}

const buildingNameOptions = {
    url: 'https://api.byu.edu:443/domains/legacy/academic/classschedule/classroom/v1/20221',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`
    }
}

const roomOptions = {
    url: '',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`
    }
}

const studentInfoOptions = {
    url: `https://api.byu.edu:443/byuapi/students/v3/${byuID}/enrolled_classes?year_terms=20221`,
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`
    }
}

async function login() {
    byuID = await getbyuID()
    token = await getWSO2()
    studentInfoOptions.url = `https://api.byu.edu:443/byuapi/students/v3/${byuID}/enrolled_classes?year_terms=20221`

    studentInfoOptions.headers =  {
        'Authorization': `Bearer ${token}`
    }

    buildingNameOptions.headers = {
        'Authorization': `Bearer ${token}`
    }
    buildingOptions.headers = {
        'Authorization': `Bearer ${token}`
    }
    roomOptions.headers = {
        'Authorization': `Bearer ${token}`
    }
    await testAPIS()
}


async function getbyuID() {
    const answer2 = await inquirer
        .prompt([{
            name: "byuID",
            type: "input",
            message: "Please input your BYU ID (ex: 123456789)",
        }])
    let answer = String(answer2.byuID)
    if (regExp.test(answer) || answer.includes('/') || answer.length != 9) {
        console.log("Invalid BYU ID")
        await getbyuID()
    }
    else {
        return answer
    }
}

async function getWSO2() {
    const answer2 = await inquirer
        .prompt([{
            name: "WSO2",
            type: "input",
            message: "Please input your WSO2 Token",
        }])
    let answer = String(answer2.WSO2)
    if (answer.length < 25 || answer.length > 35) {
        console.log("Invalid WSO2 Token")
        await getWSO2()
    }
    else {
        return answer;
    }
}

async function testAPIS() {
    console.log('You should be subscribed to the following APIs:\nStudents\nAcademicClassScheduleClassRoom\nMobileLocationService\n')
    console.log('Testing API connections...')
    try {
        let j = await axios(buildingNameOptions)
    }catch (err) {
        console.log('It appears you are not subscribed to the AcademicClassScheduleClassRoom API, or your Authorization Token is incorrect')
        console.log('Please subscribe to the AcademicClassScheduleClassRoom API and try again')
        process.exit()
    }
    try {
        let p = await axios(buildingOptions)
    }catch (err) {
        console.log('It appears you are not subscribed to the MobileLocationService API, or your Authorization Token is incorrect')
        console.log('Please subscribe to the MobileLocationService API and try again')
        process.exit()
    }
    try {
        let t = await axios(studentInfoOptions)
    }catch (err) {
        console.log('It appears you are not subscribed to the Students API, or your Authorization Token is incorrect')
        console.log('Please subscribe to the Students API and try again')
        process.exit()
    }
    console.log('You are connected to all necessary APIs')
}



async function mainMenu() {
    const answer = await inquirer
        .prompt([{
            name: "response",
            type: "list",
            message: "What would you like to do?",
            choices: ["Find empty rooms near me right now", "Find empty rooms at a different time or place", "Print a room's schedule",
                "Add downtime rooms to my current class schedule", "View current downtime schedule", "View current class schedule", "Quit"]
        },
        ])
    switch (answer.response){
        case "Find empty rooms near me right now":
            return 0
            break
        case "Print room schedule":
            return 1
            break
        case "Add downtime rooms to my current class schedule":
            return 2
            break
        case "View current downtime schedule":
            return 3
            break
        case "View current class schedule":
            return 4
            break
        case "Quit":
            return 5
            break
        case "Find empty rooms at a different time or place":
            return 6
            break
    }
}


//Get User Location
const getLocation = async () => {
    try {
        const resp = await axios.get('https://api64.ipify.org?format=json');
        let ip = resp.data.ip;
        let location =  await axios.get(`http://api.ipstack.com/${ip}?access_key=890edec894569e79839a20c72851da72`);
        let lon = location.data.longitude;
        let lat = location.data.latitude;
        return [lat, lon];
    } catch (err) {
        console.log(err)
    }
}

async function getBuildingNames() {
    try {
        buildingNameOptions.url = 'https://api.byu.edu:443/domains/legacy/academic/classschedule/classroom/v1/20221'
        let buildingNames = [];
        const info = await axios(buildingNameOptions);
        const name = info.data.ClassRoomService.response
        for (let i = 0; i < name.buildings.length; i++) {
            buildingNames.push(name.buildings[i].building_name);
        }
        return buildingNames;
    }catch(err) {
        console.log(err);
    }
}

async function isEmpty(freeRoomArray, buildingName){
    if (freeRoomArray.length === 0){
        console.log(`It appears there are no available rooms in the ${buildingName} for the amount of time you need.`)
        let answer = await inquirer
            .prompt([{
                name: "confirmA",
                type: "confirm",
                message: "Would you like to search a different BYU building?"
            }])
        if (answer.confirmA) {
            return true
        }
        else {
            return false
        }
    }
    else {
        console.log(`The following classrooms are available in the ${buildingName}:`)
        console.table(freeRoomArray)
        return false;
    }
}

async function getBuildingRooms(buildingCode) {
    try {
        buildingNameOptions.url = `https://api.byu.edu:443/domains/legacy/academic/classschedule/classroom/v1/20221/${buildingCode}`
        let roomObjects = [];
        const response = await axios(buildingNameOptions);
        const rooms = response.data.ClassRoomService.response.roomList;
        for (let i = 0; i < rooms.length-1; i++) {
            roomOptions.url = `https://api.byu.edu:443/domains/legacy/academic/classschedule/classroom/v1/20221/${buildingCode}` + `/${rooms[i].room_number}/schedule`;
            let response = await axios(roomOptions)
            let roomInfo = response.data.ClassRoomService.response
            roomObjects.push(new Room(roomInfo.room, roomInfo.room_desc));
            roomObjects[i].scheduleArray = roomInfo.schedules
        }
        return roomObjects;
    } catch(err) {
        console.log(err)
    }
}

async function getBuildingPos() {
    try {
        buildingOptions.url = 'https://api.byu.edu:443/domains/mobile/location/v2/buildings'
        let buildingObjects = [];
        const response = await axios(buildingOptions);
        for (let i = 0; i < response.data.length; i++) {
            buildingObjects.push(new Building(response.data[i].name, response.data[i].acronym, response.data[i].latitude, response.data[i].longitude));
        }
        return buildingObjects;
    } catch (err) {
        console.log(err);
    }
}

async function getBuilding(personArray, buildingArray) {
    try {
        let smallDistance = 100000;
        let arrayPos;
        for (let i = 0; i < buildingArray.length; i++){
            let distance = getDistBetween(personArray[0], personArray[1], buildingArray[i].lat, buildingArray[i].lon)
            if (distance < smallDistance){
                smallDistance = distance;
                arrayPos = i;
            }
        }
    } catch(err) {
        console.log(err);
    }
}

async function getStudentSchedule() {
    let dayArray = []
    let studentSchedule = []
    try {
        const info = await axios(studentInfoOptions);
        for (let i = 0; i < info.data.values.length; i++) {
            let className = info.data.values[i].course_title.value
            let id = info.data.values[i].curriculum_id.value
            let building = info.data.values[i].when_taught.object_array[0].building.value
            let room =info.data.values[i].when_taught.object_array[0].room.value
            let startTime = info.data.values[i].when_taught.object_array[0].start_time.value
            let endTime = info.data.values[i].when_taught.object_array[0].end_time.value
            let online = info.data.values[i].taught_online.value
            let days = info.data.values[i].when_taught.object_array[0].days.value
            let studName = info.data.values[i].byu_id.description
            if (days == "Daily"){
                days = "MTWThF"
            }
            if (days != null) {
                dayArray = daysParse(days)
            }
            studentSchedule.push(new classes.Course(className, id, studName, building, room, startTime, endTime, online, dayArray))
        }
    }catch(err) {
        console.log(err);
    }
    database.writeDatabase(studentSchedule, byuID)
    return studentSchedule
}

async function getStudentFreeTime(studentScheduleArray) {
    for (let k = 0; k < studentScheduleArray.length; k++) {
        let timeSecs = convertTime(time);
        let startTime = buildingArray[i].roomArray[j].weekScheduleArray[dayNumber][k][0]
        let endTime = buildingArray[i].roomArray[j].weekScheduleArray[dayNumber][k][1]
        let startTimeSecs = convertTime(startTime)
        let endTimeSecs = convertTime(endTime)
        if (timeSecs < startTimeSecs) {
            if (buildingArray[i].roomArray[j].weekScheduleArray[dayNumber][k - 1]) {
                if (timeSecs > convertTime(buildingArray[i].roomArray[j].weekScheduleArray[dayNumber][k - 1][0]) && startTimeSecs - timeSecs > needTime) {
                    freeTime.push(buildingArray[i].roomArray[j].number + " until " + startTime)
                }
            } else if (startTimeSecs - timeSecs > needTime) {
                freeTime.push(buildingArray[i].roomArray[j].number + " until " + startTime)
            }
        }
    }
    return freeTime
}

function getDistanceBetween(lat1, lon1, lat2, lon2, unit) {
    if ((lat1 == lat2) && (lon1 == lon2)) {
        return 0;
    }
    else {
        let radlat1 = Math.PI * lat1/180;
        let radlat2 = Math.PI * lat2/180;
        let theta = lon1-lon2;
        let radtheta = Math.PI * theta/180;
        let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        if (dist > 1) {
            dist = 1;
        }
        dist = Math.acos(dist);
        dist = dist * 180/Math.PI;
        dist = dist * 60 * 1.1515;
        if (unit=="K") { dist = dist * 1.609344 }
        if (unit=="N") { dist = dist * 0.8684 }
        return dist;
    }
}

function scanArray(nameArray, buildingLocs){
    let buildingLocations = [];
    for (let i = 0; i < buildingLocs.length; i++){
        for (let j = 0; j < nameArray.length; j++){
            if (nameArray[j] == buildingLocs[i].code){
                 buildingLocations.push(buildingLocs[i])
            }
        }
    }
    return buildingLocations;
}

function getDistBetween(lat1, lon1, lat2, lon2){
    if ((lat1 == lat2) && (lon1 == lon2)) {
        return 0;
    }
    else {
        return math.sqrt(math.pow((lat1 + lat2), 2) + math.pow((lon1 + lon2), 2))
    }
}

// Converts numeric degrees to radians
function toRad(Value)
{
    return Value * Math.PI / 180;
}

async function askUserBuilding(buildingArray) {
    const answer = await inquirer
        .prompt([{
            name: "name",
            type: "list",
            message: "Which BYU building would you like to search?",
            choices: buildingArray,
        },
        ])
    const answer2 = await inquirer
        .prompt([
            {
                name: "confirmAnswer",
                type: "confirm",
                message: `Are you sure you like to find empty classrooms in the ${answer.name}? \n If not, click \"n\"`,
            },
        ])
        if (answer2.confirmAnswer){
            return answer.name;
        }
        else {
            await askUserBuilding(buildingArray);
        }
}

async function getBuildingRoomSchedule(buildingName, buildingArray) {
    for (let i = 0; i < buildingArray.length; i++) {
        if (buildingArray[i].name == buildingName) {
            let roomObjectArray = await getBuildingRooms(buildingArray[i].code);
            buildingArray[i].roomArray = roomObjectArray;
        }
    }
    return buildingArray;
}


async function askUserNeedTime(question){
    let seconds = 60
    const answer = await inquirer
        .prompt([{
            name: "minutes",
            type: "number",
            message: question,
        },
        ])
    if (!answer.minutes && answer.minutes != 0){
        console.log("Please enter a number")
        await askUserNeedTime();
    }
    else {
        return seconds * answer.minutes
    }
}


async function getBusyTimes(buildingArray, buildingName){
    let busyTimeArray
    let tArray = []
    let wArray = []
    let thArray = []
    let fArray = []
    let sArray = []
    let suArray = []
    let mArray = []
    let dayArray;
    let time
    for (let i = 0; i < buildingArray.length; i++) {
        if (buildingArray[i].name == buildingName) {
            if (buildingArray[i].roomArray){
                for (let j = 0; j < buildingArray[i].roomArray.length; j++){
                    for (let k = 0; k < buildingArray[i].roomArray[j].scheduleArray.length; k++){
                        busyTimeArray = []
                        let days = buildingArray[i].roomArray[j].scheduleArray[k].days
                         if (days == "Daily"){
                             days = "MTWThF"
                         }
                        dayArray = daysParse(days)
                        time = buildingArray[i].roomArray[j].scheduleArray[k].class_time
                        for (let l = 0; l < dayArray.length; l++) {
                            switch (dayArray[l]) {
                                case 'M':
                                    mArray.push(timeParse(time))
                                    break;
                                case "T":
                                    tArray.push(timeParse(time))
                                    break;
                                case "W":
                                    wArray.push(timeParse(time))
                                    break;
                                case 'Th':
                                    thArray.push(timeParse(time))
                                    break;
                                case "F":
                                    fArray.push(timeParse(time))
                                    break;
                                case 'S':
                                    sArray.push(timeParse(time))
                                    break;
                                case "Su":
                                    suArray.push(timeParse(time))
                                    break;
                            }
                        }
                    }
                    buildingArray[i].roomArray[j].weekScheduleArray.push(mArray)
                    buildingArray[i].roomArray[j].weekScheduleArray.push(tArray)
                    buildingArray[i].roomArray[j].weekScheduleArray.push(wArray)
                    buildingArray[i].roomArray[j].weekScheduleArray.push(thArray)
                    buildingArray[i].roomArray[j].weekScheduleArray.push(fArray)
                    buildingArray[i].roomArray[j].weekScheduleArray.push(sArray)
                    buildingArray[i].roomArray[j].weekScheduleArray.push(suArray)
                    mArray = []
                    tArray = []
                    wArray = []
                    thArray = []
                    fArray = []
                    sArray = []
                    suArray = []
                }
            }
        }
    }
    return buildingArray;
}

async function getFreeRooms(buildingArray, buildingName, day, time, roomType, needTime) {
    let freeObj = []
    const dayNumber = database.dayNum(day);
    for (let i = 0; i < buildingArray.length; i++) {
        if (buildingArray[i].name == buildingName && buildingArray[i].roomArray) {
            for (let j = 0; j < buildingArray[i].roomArray.length; j++){
                if (buildingArray[i].roomArray[j].description == roomType){
                    for (let k = 0; k < buildingArray[i].roomArray[j].weekScheduleArray[dayNumber].length; k++){
                        let timeSecs = await convertTime(time);
                        let startTime = buildingArray[i].roomArray[j].weekScheduleArray[dayNumber][k][0]
                        let endTime = buildingArray[i].roomArray[j].weekScheduleArray[dayNumber][k][1]
                        let startTimeSecs = convertTime(startTime)
                        let endTimeSecs = convertTime(endTime)
                        if (timeSecs < startTimeSecs) {
                            if (buildingArray[i].roomArray[j].weekScheduleArray[dayNumber][k - 1]) {
                                if (timeSecs > convertTime(buildingArray[i].roomArray[j].weekScheduleArray[dayNumber][k - 1][0]) && startTimeSecs - timeSecs > needTime) {
                                    freeObj.push(new FreeRoom(buildingArray[i].roomArray[j].number, startTime))
                                }
                            }
                        else if (startTimeSecs - timeSecs > needTime) {
                            freeObj.push(new FreeRoom(buildingArray[i].roomArray[j].number, startTime))
                        }
                        }
                    }
                }
                }
            }
        }
    return freeObj
}

function daysParse(days){
    let dayArray = days.split("")
    for (let i = 0; i < dayArray.length; i++){
        if (dayArray[i] == 'h'){
            dayArray[i-1] = "Th"
            dayArray[i] = ""

        }
    }
    dayArray = dayArray.filter(item => item !== "")
    return dayArray
}

function timeParse(time){
    let timeArray = time.split(" - ")
    for (let i = 0; i < timeArray.length; i++){
        let hour = timeArray[i];
        if (hour.charAt(hour.length-1) == "p"){
            let newHourArray = hour.split(":")
            let newHour = parseInt(newHourArray[0])
            if (newHour != 12) {
                newHour += 12
            }
            newHour.toString()
            timeArray[i] = newHour + ":" + newHourArray[1];
        }
    }
    for (let i = 0; i < timeArray.length; i++){
        timeArray[i] = timeArray[i].substring(0, timeArray[i].length-1)
    }
    return timeArray;
}

async function timeAdd(startTime, hourAdd, minAdd)  {
    let timeArray = startTime.split(":")
    let newHour = parseInt(timeArray[0])
    newHour += hourAdd;
    let newMin = parseInt(timeArray[1])
    newMin += minAdd * 60;
    let endTime = newHour.toString() + ':' + newMin.toString()
    return endTime
}

function getCurrDay() {
    const weekday = ["S","M","T","W","Th","F","S"];
    let today = new Date();
    let day = weekday[today.getDay()];
    let currentDay = day;
    return currentDay;
}

function getCurrTime() {
    let today = new Date();
    let hours = (today.getHours() + 11) % 12 + 1;
    hours = hours > 12 ? hours + 12 : hours;
    let minutes = today.getMinutes();
    let currentTime = hours + ":" + minutes;
    return currentTime;
}
function convertTime(time) {
    let str1 = time.split(":")
    let totalSecs = parseInt(str1[0] * 3600 + str1[1] * 60)
    return totalSecs
}

async function printStudSched(studSched) {
    console.table(studSched)
}

async function checkTime(studSched, time, days, message) {
    let newTime = convertTime(time)
     for (let i = 0; i < studSched.length; i++) {
         if (studSched[i].online != true) {
             for (let j = 0; j < studSched[i].days.length; j++) {
                 for (let k = 0; k < days.length; k++) {
                     if (studSched[i].days[j] == days[k] && convertTime(studSched[i].startTime) <= newTime && newTime <= convertTime(studSched[i].endTime)) {
                         console.log(`It looks like you are busy on ${letterToDay(days[k])} at${time} with ${studSched[i].name}`)
                         console.log(message)
                         return true;
                     }
                     else {
                         continue
                     }
                 }
             }
         }
     }
     return false;
 }

async function checkOnlineClasses(studSched, buildingArray) {
    let daysArray
    let days
    let userTime
    let needTime
    let roomType = "CLASSROOM"
    for (let i = 0; i < studSched.length; i++) {
        if (studSched[i].startTime == null) {
            const answer = await inquirer
                .prompt([{
                    name: "ans",
                    type: "confirm",
                    message: `${studSched[i].name} is an online class \nWould you like to add a place and time where you plan on taking this class during the week?`
                }])
            if (answer.ans) {
                let answerDays = await inquirer
                    .prompt([{
                        name: "day",
                        type: "checkbox",
                        message: "On which days would you like to schedule this class",
                        choices: ['M', 'T', 'W', 'Th', 'F', 'S', 'Su']
                    }])
                daysArray = answerDays.day
                days = answerDays.day.join('')
                let answer3 = await inquirer
                    .prompt([{
                        name: "times",
                        type: "datetime",
                        message: "Select the time you want to start studying",
                        format: ['H', ':', 'MM'],
                        initial: new Date('1999-12-31 6:00'),
                        time: {
                            min: '6:00',
                            max: '23:00'
                        },
                        minutes: {
                            interval: 5
                        },
                        choices: []
                    }])
                userTime = answer3.times.toString()
                userTime = userTime.substr(15, 6)
                needTime = await askUserNeedTime(`How many minutes do you plan on studying ${studSched[i].name} on your chosen days?`)
                needTime /= 60
                let fullTime = needTime / 60
                let minTime = fullTime - Math.floor(fullTime) * 60
                let hTime = Math.floor(fullTime)

                let endTime = await timeAdd(userTime, hTime, minTime)
                if (await checkTime(studSched, userTime, daysArray, 'Please choose a time and day when you are free to schedule your online class')) {
                    await checkOnlineClasses(studSched, buildingArray)
                } else {
                    let buildingCode
                    let answer4 = await inquirer
                        .prompt([{
                            name: "building",
                            type: "list",
                            choices: buildingArray,
                            message: `In what BYU building will you take ${studSched[i].name}?`
                        }])
                    let daysAvailable = await checkRooms(answer4.building, buildingArray, studSched, days, userTime, roomType, needTime, daysArray, needTime, checkOnlineClasses)
                    let answer5 = await inquirer
                        .prompt([{
                            name: "room",
                            type: "list",
                            choices: daysAvailable,
                            message: `In what room would you like to take ${studSched[i].name}?`
                        }])
                    for (let t = 0; t < buildingArray.length; t++ ) {
                        if (answer4.building == buildingArray[t].name){
                            buildingCode = buildingArray[t].code
                        }
                    }
                    studSched[i].building = buildingCode
                    studSched[i].room = answer5.room
                    studSched[i].startTime = userTime
                    studSched[i].endTime = endTime
                    studSched[i].days = daysArray
                    await database.writeDatabase(studSched, byuID)
                    console.log("Your schedule has been updated")
                    return studSched
                }
            }
            else {
                return studSched
            }
        }
    }
    return studSched
}

async function addDownTime(studSched, buildingArray) {
    let daysArray = []
    let choicesArray = []
    let days
    let userTime
    let needTime
    let roomType = "CLASSROOM"
    let className = 'Down Time'
    let id = '00000'
    let studName = studSched[0].studName
    let answerDays = await inquirer
        .prompt([{
            name: "day",
            type: "checkbox",
            message: "On which days would you like to schedule downtime?",
            choices: ['M', 'T', 'W', 'Th', 'F', 'S', 'Su']
        }])
    daysArray = answerDays.day
    days = answerDays.day.join('')
    let answer3 = await inquirer
        .prompt([{
            name: "times",
            type: "datetime",
            message: "Select the time you want to start studying",
            format: ['H', ':', 'MM'],
            initial: new Date('1999-12-31 6:00'),
            time: {
                min: '6:00',
                max: '23:00'
            },
            minutes: {
                interval: 5
            }
        }])
    userTime = answer3.times.toString()
    userTime = userTime.substr(15, 6)
    needTime = await askUserNeedTime(`How many minutes will your downtime be on your chosen days?`)
    needTime /= 60
    let fullTime = needTime / 60
    let minTime = fullTime - Math.floor(fullTime) * 60
    let hTime = Math.floor(fullTime)
    let endTime = await timeAdd(userTime, hTime, minTime)
    if (await checkTime(studSched, userTime, daysArray, 'Please choose a time and day when you are free to schedule your downtime')) {
        await addDownTime(studSched, buildingArray)
    }
    else {
        let buildingCode
        let answer4 = await inquirer
            .prompt([{
                name: "building",
                type: "list",
                choices: buildingArray,
                message: `In what BYU building will you spend your downtime?`
            }])
        let daysAvailable = await checkRooms(answer4.building, buildingArray, studSched, days, userTime, roomType, needTime, addDownTime)

        for (let q = 0; q < daysAvailable.length; q++){
            choicesArray.push({
                name: daysAvailable.name,
                value: "t"
            })
        }
        let answer5 = await inquirer
            .prompt([{
                name: "room",
                type: "list",
                choices: choicesArray,
                message: `In what room would you like to take spend your downtime?`
            }])
        for (let t = 0; t < buildingArray.length; t++ ) {
            if (answer4.building == buildingArray[t].name) {
                buildingCode = buildingArray[t].code
            }
        }
        let online = false
        studSched.push(new classes.Course(className, id, studName, buildingCode, answer5.room, userTime, endTime, online, daysArray))
        await database.writeDatabase(studSched, byuID)
        console.log("Your schedule has been updated")
        return studSched
    }

}

async function confirm(question) {
    let answer = await inquirer
        .prompt([{
            name: "confirmation",
            type: "confirm",
            message: question
        }])
    if (answer.confirmation) {
        return true
    }
    else {
        return false
    }
}

async function checkRooms(building, buildingArray, studSched, days, userTime, roomType, needTime, functionName) {
    let daysAvailable = [];
    let freeRoomArray = []
    let fullArray = [];
    console.log('Calculating room availability...')
    console.log('This may take several moments...')
    for (let t = 0; t < days.length; t++) {
        let buildingLocsRooms = await getBuildingRoomSchedule(building, buildingArray)
        buildingLocsRooms = await getBusyTimes(buildingLocsRooms, building);
        freeRoomArray = await getFreeRooms(buildingLocsRooms, building, days[t], userTime, roomType, needTime);
        fullArray = fullArray.concat(freeRoomArray)
    }
    for (let i = 0; i < freeRoomArray.length; i++) {
        if (days.length == getOccurrence(fullArray, freeRoomArray[i])) {
            daysAvailable.push(freeRoomArray[i])
        }
    }
    if (daysAvailable.length == 0) {
        let answer = await inquirer
            .prompt ([{
            name: "names",
            type: "confirm",
            message: `It appears there are no rooms available in the ${building}. Would you like to schedule a different building?`
        }])
        if (answer.names) {
            await functionName(studSched, buildingArray)
        }
    }
    else {
        console.log(`The following rooms are available in the ${building} at${userTime} for at least ${needTime} minutes on the days you have chosen`)
        console.table(daysAvailable, ['Room_Number', 'Available_Until'])
        return daysAvailable
    }
}

function getOccurrence(array, value) {
    let count = 0;
    if (array.length == 0){
        return count;
    }
    else {
        for (let j = 0; j < array.length; j++) {
            if (array[j].Room_Number == value.Room_Number && array[j].Available_Until == value.Available_Until) {
                count++
            }
        }
        return count;
    }
}

function letterToDay(letter) {
    switch (letter) {
        case 'M':
            return 'Monday'
        case 'T':
            return 'Tuesday'
        case 'W':
            return 'Wednesday'
        case 'Th':
            return 'Thursday'
        case 'F':
            return 'Friday'
        case 'S':
            return 'Saturday'
        case 'Su':
            return 'Sunday'
    }

}


//Export Functions
module.exports = {getLocation, getBuildingPos, getBuilding, getBuildingNames, scanArray, askUserBuilding,
    getBuildingRoomSchedule, getFreeRooms, getCurrDay, getCurrTime, getBusyTimes, mainMenu, askUserNeedTime,
    getStudentSchedule, login, printStudSched, checkOnlineClasses, isEmpty, addDownTime, confirm}

