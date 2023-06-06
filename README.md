# Flask Website Forum

## What is this?

This project is a university assignment for creating a full stack web application using Flask and Mysql for the server-side. The goal of the assignment was to create a social forum that users could post to. The following features were included within the website:

1. Live updates - allowing the website to update in real-time without any reloads
2. A subdivision of topics for users to create. Each topic has a number of claims (posts). Each claim can be related to another claim at creation.
3. A reply system for each claim. Each reply can be categorised and associated with either a claim or another reply.
4. A search function
5. Animations using JavaScript

## Installation

1. Download repository.
2. pip install virtualenv.
3. scripts\activate
4. pip install flask mysql-connector-python
6. Change 'user' (line 11) and 'password' (line 12) to your preferred Mysql server username and password
7. mysql -u <username> -p websitedatabase < datadump.sql
