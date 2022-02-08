const functions = require("./lib.js");
const database = require("./database.js")

async function main() {
    await database.getOracleCredentials()
    await database.testOracleConnectivityAws()
    await functions.login()

    let time = functions.getCurrTime();
    let needTime = 0;
    let day = functions.getCurrDay();
    let roomType = 'CLASSROOM';
    let needRepeat = true;
    let buildingLocs = await functions.getBuildingPos()
    let buildingNames = await functions.getBuildingNames()
    buildingLocs = await functions.scanArray(buildingNames, buildingLocs)
    let studentSchedule = await functions.getStudentSchedule()

    let mainResponse = await functions.mainMenu()

    while (mainResponse != 5) {
        switch (mainResponse) {
            case 0:
                needRepeat = true;
                while (needRepeat) {
                    let buildingName = await functions.askUserBuilding(buildingLocs)
                    needTime = await functions.askUserNeedTime("How many minutes will you need the room?");
                    console.log("Retrieving data...")
                    console.log("This calculation may take a few moments...")
                    let buildingLocsRooms = await functions.getBuildingRoomSchedule(buildingName, buildingLocs)
                    buildingLocsRooms = await functions.getBusyTimes(buildingLocsRooms, buildingName);
                    let freeRoomArray = await functions.getFreeRooms(buildingLocsRooms, buildingName, day, time, roomType, needTime);
                    needRepeat = await functions.isEmpty(freeRoomArray, buildingName);
                }
                mainResponse = await functions.mainMenu();
                break;

            case 1:
                break;
            case 2:
                needRepeat = true
                studentSchedule = await functions.checkOnlineClasses(studentSchedule, buildingLocs)
                while(needRepeat) {
                    console.log("Here is your current schedule:")
                    console.table(studentSchedule)
                    studentSchedule = await functions.addDownTime(studentSchedule, buildingLocs)
                    needRepeat = await functions.confirm('Would you like to add more downtime to your schedule?')
                }
                mainResponse = await functions.mainMenu();
                break;
            case 3:
                //studentSchedule = await functions.checkOnlineClasses(studentSchedule, buildingLocs)
                await functions.printStudSched()
                mainResponse = 5;
                break;
            case 6:
                break;
        }
    }

}

main();




