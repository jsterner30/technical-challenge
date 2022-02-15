
# Downtime Scheduler

This program allows you to schedule downtime during your off hours on campus.
It searches building classrooms at your desired time and provides you with a list of available rooms.
The program also allows you to schedule study time for online classes

Enjoy!

## Before You Use Downtime Scheduler:

### Subscribe to necessary BYU APIs
In order to use this program you must be subscribed to 4 four BYU APIs:

1. Persons - v3

[Link to Persons API page](https://api.byu.edu/store/apis/info?name=Persons&version=v3&provider=BYU%2Fjohnrb2)

2. Students - v3
[Link to Students API page](https://api.byu.edu/store/apis/info?name=Students&version=v3&provider=BYU%2Fmdh26)

3. MobileLocationService - v2
[Link to MobileLocationService API page](https://api.byu.edu/store/apis/info?name=MobileLocationService&version=v2&provider=BYU%2Fben1996)

 4. AcademicClassRoomClassSchedule - v1

[Link to AcademicClassRoomClassSchedule API page](https://api.byu.edu/store/apis/info?name=AcademicClassScheduleClassRoom&version=v1&provider=BYU%2Ftrevash)


### Connect to AWS

In order to use this program you must connect to BYU's AWS. To do so:

    1. Visit [BYU's Amazon Webservice Site]: https://byulogin.awsapps.com/start#/
    2. Log in
    3. Copy PowerShell Environmental Variables
    4. Save AWS Environmental Variable to your computer

### Connect to VPN

    1. Open the GlobalProtect app on your computer
    2. Click "Connect" 

### Download Program Files from Github

    1. Copy and download this Github reposisitory
    2. Open files in a new Node.js project
    3. Run "npm install" in your npm terminal


## Using Downtime Scheduler:
Congratulations. You are now ready to use the program.

### Downtime Scheduler Will Run as Follows:

#### Welcome
    1. You are welcomed and the program description is displayed

#### Login
    1. Your connection to AWS and VPN are tested
    2. You are asked to input your BYU ID and WSO2 token
    3. If your WSO2 token is correct and you are subscribed to all necessary API's, you will be logged allowed to proceed.

#### Main Menu
The user can do any of the following:

    1. Add downtime to schedule
    2. View current schedule
    3. Find empty rooms near me right now
    4. Remove downtime from schedule
    5. Add a place and time for an online classes
    6. Edit online classes
    7. Quit

#### Add Downtime to Schedule
Inputs:

    1. A desired building
    2. What days the user plans on using downtime
    3. When the user wants to do downtime
    4. How long the user needs the room
    5. Which room they want to study in 

Output:

    "Your schedule has been sucessfully updated"

#### View Current Schedule
Inputs:
    
    None

Outputs:

    Printed Weekly Schedule

#### Find empty rooms near me right now
Inputs: 

    1. The users building
    2. How long the user needs the room

Output: 

    Printed List of Current Free Rooms


#### Remove Downtime from Schedule
Inputs:

    What downtime to remove

Output:

    "Your schedule has been sucessfully updated"


#### Add a place and time for an online classes

Inputs: 

    1. A desired building
    2. What days the user plans on studying their online class
    3. When the user wants to study their online class
    4. How long the user needs the room
    5. Which room they want to study in 
    

Output: 

    "Your schedule has been sucessfully updated"

#### Edit Online Schedule
Inputs: 

   What downtime to remove
    

Output: 

    "Your schedule has been sucessfully updated"

#### Quit
Inputs: 

    None

Output:

    "Have a great day!