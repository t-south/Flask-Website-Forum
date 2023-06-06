from flask import Flask, session, url_for, render_template, request, json, escape
import mysql.connector
import hashlib
import os
import re
import time
app = Flask(__name__)
app.secret_key = os.urandom(24)
salt = b'\xad\x95\xc8\xc0\x12g\x01I\x07\xee=\xc4\xc4\xaen\xcb'
def dbConnect():
    cnx = mysql.connector.connect(user='',
                     password='',
                     host='127.0.0.1',
                     database='websiteDatabase')
    cursor = cnx.cursor()
    return cnx, cursor    

@app.route('/')
def view():
    if session.get("login") is not None:
        userId = session['login']
       
        cnx, cursor = dbConnect() 
        query = "select userName from websiteDatabase.user where userId = %s;"
        cursor.execute(query, (userId,))
        result = cursor.fetchone()
        for userName in result:
            cnx.close()            
            return render_template("index.html", userName = escape(userName))
    else:
        return render_template("index.html")


@app.route('/createAccount', methods=["POST"])
def createAccount():
    username = request.form.get("userNameCreate")   
    password = request.form.get("passwordCreate")
    passwordConfirm = request.form.get("passwordConfirm")
    cnx, cursor = dbConnect()    
    query = "select userName from websiteDatabase.user where userName = %s;"
    cursor.execute(query, (username,))
    #check there are no other users with the same username and the passwords match
    result = cursor.fetchall()
    if(len(result) == 0 and password == passwordConfirm):    
        global salt
        passwordHash = hashlib.sha256(password.encode('utf-8') + salt).hexdigest()         
        query = "insert into websiteDatabase.User(userName, passwordHash, admin)values(%s, %s, %s);"
        cursor.execute(query, (username, passwordHash, 0,))
        cnx.commit()                  
        cnx.close()    
        return json.dumps({"created":"true", "username":"true"})    
    else:
        cnx.close()
        return json.dumps({"created":"false", "username":"false"})


    
@app.route('/login', methods=["POST"])
def login():
    username = request.form.get("userNameLogin")
    password = request.form.get("passWordLogin")
    cnx, cursor = dbConnect()
    query = "select userId, userName, passwordHash, admin  from websiteDatabase.user where userName = %s;"
    cursor.execute(query, (username,))
    result = cursor.fetchall()
    if(len(result) == 1):
        global salt
        for userId, userName, passwordHash, admin in result:            
            passwordCheck = hashlib.sha256(password.encode('utf-8') + salt).hexdigest()            
            if(passwordHash == passwordCheck):                
                session["login"] = userId               
                cnx.close()
                return json.dumps({"Login": "true", "username": escape(userName), "password": "true", "admin": escape(admin)})
            else:
                return json.dumps({"Login": "false", "username":"true", "password": "false", "admin": "false"}) 
    else:
        cnx.close()
        return json.dumps({"Login": "false", "username":"false", "password": "false", "admin": "false" })


@app.route('/logout', methods=["GET"])
def logout():
    if session.get("login") is not None:
        session.pop("login", None)
        return json.dumps({"Logout": "true"})
    else:
        return json.dumps({"Logout": "false"})

    
@app.route('/createTopic', methods=["POST"])
def createTopic():
    if session.get("login") is not None:
        cnx, cursor = dbConnect()
        query = "SELECT count(*) FROM websiteDatabase.topic;"
        cursor.execute(query)
        result = cursor.fetchone()
        position = 0
        for rowCount in result:
            position = rowCount + 1
        userId = session["login"]
     
        topicName = request.form.get("topicName")      
        query = "insert into websiteDatabase.Topic(userId, topicName, creationTime, position)values(%s, %s, %s, %s);"
        cursor.execute(query, (userId, topicName, time.strftime('%Y-%m-%d %H:%M:%S'), position))        
        cnx.commit()    
        query = "SELECT Topic.topicId, Topic.topicName, User.userName, Topic.creationTime FROM topic inner join User ON Topic.userId = User.userId where topic.userId = %s order BY topic.position desc limit 1;"
        cursor.execute(query, (userId,))
        result = cursor.fetchall()
        for topicId, topicName, userName, creationTime in result:
                     
            cnx.close()  
            return json.dumps({"Login": "true", "username": escape(userName), "topic" : escape(topicName), "timeAdded" : escape(creationTime), "id" : escape(topicId) })
    else:
        return json.dumps({"Login":"false"})


@app.route('/createClaim', methods=["POST"])
def createClaim():
    if session.get("login") is not None:
        cnx, cursor = dbConnect()
        topicListId = request.form.get("topicId")        
        claimHeader = request.form.get("claimHeader")
        content = request.form.get("claimContent")
        query = "SELECT count(claimId) FROM websiteDatabase.claim where claim.topicId = %s;"
        cursor.execute(query, (topicListId,))
        result = cursor.fetchone()
        position = 0
        for rowCount in result:
            position = rowCount + 1
        relationships = []
        userId = session["login"]     
        query = "insert into websiteDatabase.Claim(userId, topicId, claimHeader, content, creationTime, position)values(%s, %s, %s, %s, %s, %s);"
        cursor.execute(query, (userId, topicListId, claimHeader, content, time.strftime('%Y-%m-%d %H:%M:%S'), position))        
        cnx.commit() 
        query = "SELECT Claim.claimId, Claim.claimHeader, Claim.content, User.userName, Claim.creationTime, claim.topicId FROM claim inner join User ON Claim.userId = User.userId where Claim.topicId = %s order by claim.topicId desc, claim.position desc limit 1;"
        cursor.execute(query, (topicListId,))
        result = cursor.fetchall()
        for claimId, claimHeader, content, userName, creationTime, topicId in result:
            for k, v in request.form.items():
                if(v != "opposed" or v != "equivalent"):
                    query = "select Claim.claimId from websiteDatabase.Claim where claimId = %s;"
                    cursor.execute(query, (k,))
                    isClaimPresent = cursor.fetchall()                    
                    if(len(isClaimPresent) == 1):                        
                        query = "insert into websiteDatabase.ClaimRelationship(claimId1, claimId2, relationshipType)values(%s, %s, %s);"
                        cursor.execute(query, (claimId, k,v,))
                        key = escape(k)
                        value = escape(v)
                        relationships.append({"relatedClaim": key, "type": value})
                        cnx.commit()
            cnx.close()            
            return json.dumps({"Login": "true", "ClaimId": escape(claimId), "TopicId": escape(topicId), "username": escape(userName), "claimHeader": escape(claimHeader), "claimContent": escape(content),"timeAdded" : escape(creationTime), "Relationship" : escape(relationships) })
    else:
        return json.dumps({"Login":"false"})



@app.route('/createReply', methods=["POST"])
def createReply():  
    if session.get("login") is not None:
        claimPageId = request.form.get("formClaimId")        
        replyType = request.form.get("replyDropDown")
        replyContent = request.form.get("replyMessage")   
        cnx, cursor = dbConnect()
        query = "SELECT count(*) FROM websiteDatabase.reply where reply.claimId = %s;"
        cursor.execute(query, (claimPageId,))
        result = cursor.fetchone()
        position = 0
        for rowCount in result:
            position = rowCount + 1
        userId = session["login"]     
        query = "insert into websiteDatabase.Reply(claimId, userId, content, relationshipType, creationTime, position)values(%s, %s, %s, %s, %s, %s);"        
        cursor.execute(query, (claimPageId, userId, replyContent, replyType, time.strftime('%Y-%m-%d %H:%M:%S'),position,))        
        cnx.commit()
        query = "SELECT User.userName, Reply.replyId, Reply.claimId, Reply.content, Reply.relationshipType, Reply.creationTime FROM Reply inner join User ON Reply.userId = User.userId where Reply.userId = %s AND Reply.claimId = %s order by reply.claimId desc, reply.position desc limit 1;"
        cursor.execute(query, (userId, claimPageId,))
        result = cursor.fetchall()
        relType = ''
        for userName, replyId, claimId, content, relationshipType, creationTime in result:            
            if(relationshipType == 1):
                relType = "Clarification"
            elif(relationshipType == 2):
                relType = "Supporting Argument"
            elif(relationshipType == 3):
                relType = "Counterargument"
            cnx.close()
            return json.dumps({"Login": "true", "username": escape(userName), "replyId" : escape(replyId),  "ClaimId": escape(claimId), "replyContent": escape(content), "relationship": escape(relType), "timeAdded" : escape(creationTime)})
    else:
        return json.dumps({"Login":"false"})


@app.route('/createSubReply', methods=["POST"])
def createSubReply():    
    if session.get("login") is not None:        
        userId = session["login"]
        parentReplyId = request.form.get("parentReplyId")        
        replyType = request.form.get("subReplyDropDown")
        replyContent = request.form.get("subReplyMessage")
        parentType = request.form.get("parentType")
        currentReply = request.form.get("currentReplyId")
        subreply = ''
        cnx, cursor = dbConnect()
        position = 0
        replyId = ''
        #check that the reply id is not a sub reply
        #if a sub reply is found then       
        if(parentType == "ancestor"):

            query = "SELECT replyId FROM websiteDatabase.subreply WHERE subReplyId = %s;"
            cursor.execute(query, (currentReply,))
            result = cursor.fetchone()            
            for reply in result:
                replyId = reply

                query = "insert into websiteDatabase.subreply(replyId, userId, content, relationshipType, creationTime, position)values(%s, %s, %s, %s, %s, %s);"        
                cursor.execute(query, (replyId, userId, replyContent, replyType, time.strftime('%Y-%m-%d %H:%M:%S'), position,))
                cnx.commit()                
                query = "SELECT subReplyId FROM websiteDatabase.subReply where userId = %s order by subreply.creationTime desc limit 1;"
                cursor.execute(query, (userId,))
                result = cursor.fetchone()
           
            for subReplyId in result:
   
                subreply = subReplyId
                query = "UPDATE websiteDatabase.subreply SET parentReplyId = %s WHERE subReplyId = %s;"
                cursor.execute(query, (currentReply, subReplyId, ))
                cnx.commit()
                query = "SELECT count(*) FROM websiteDatabase.subreply where subreply.parentReplyId = %s;"
                cursor.execute(query, (currentReply,))
                result = cursor.fetchone()            
                for rowCount in result:
                    position = rowCount
                query = "UPDATE websiteDatabase.subreply SET subReply.position = %s WHERE subReplyId = %s ;"
                cursor.execute(query, (position, subReplyId, ))
                cnx.commit()
    
            query = "select user.username, subreply.subreplyId, subreply.parentReplyId, subreply.replyId, subreply.content, subreply.relationshipType, subreply.creationTime from subreply inner join User on subreply.userId = User.userId where subreply.userId = %s and subreply.subreplyId = %s order BY subreply.replyId desc, subreply.position desc limit 1;"
            cursor.execute(query, (userId, subReplyId,))
            result = cursor.fetchall()
            
            for userName, subReplyId, parentReplyId, replyId, content, relationshipType, creationTime in result:
                relType = ''
                if(relationshipType == 1):
                    relType = "Evidence"
                elif(relationshipType == 2):
                    relType = "Support"
                elif(relationshipType == 3):
                    relType = "Rebuttal"
                cnx.close()
                return json.dumps({"Login": "true", "username": escape(userName), "subReplyId" : escape(subReplyId),  "topReply": escape(parentReplyId), "replyContent": escape(content), "relationship": escape(relType), "timeAdded" : escape(creationTime), "parentType": escape(parentType)})
        elif(parentType == "parent"):
            query = "SELECT count(*) FROM websiteDatabase.subreply where subreply.replyId = %s;"
            cursor.execute(query, (parentReplyId,))
            pos = cursor.fetchone()
            for rowCount in pos:
                position = rowCount + 1
            query = "insert into websiteDatabase.subreply(replyId, userId, content, relationshipType, creationTime, position)values(%s, %s, %s, %s, %s, %s);"        
            cursor.execute(query, (parentReplyId, userId, replyContent, replyType, time.strftime('%Y-%m-%d %H:%M:%S'),position, ))    
            cnx.commit()
            query = "SELECT User.userName, subreply.subReplyId, subreply.replyId, subreply.content, subreply.relationshipType, subreply.creationTime FROM subreply inner join User ON subreply.userId = User.userId where subreply.userId = %s order BY subreply.creationTime desc limit 1;"
            cursor.execute(query, (userId,))
            result = cursor.fetchall()
        for userName, subReplyId, replyId, content, relationshipType, creationTime in result:
            relType = ''
            if(relationshipType == 1):
                relType = "Evidence"
            elif(relationshipType == 2):
                relType = "Support"
            elif(relationshipType == 3):
                relType = "Rebuttal"
            cnx.close()
            return json.dumps({"Login": "true", "username": escape(userName), "subReplyId" : escape(subReplyId),  "topReply": escape(replyId), "replyContent": escape(content), "relationship": escape(relType), "timeAdded" : escape(creationTime), "parentType": escape(parentType)})
        
    else:
        return json.dumps({"Login":"false"})


    

@app.route('/showSubReplies', methods=["GET"])
def showSubReplies():
    replyType = request.args.get("replyType")
    replyid = request.args.get("replyId")
    jsonData = {}
    subReplies = []
    cnx, cursor = dbConnect()    
    if(replyType == "reply"):        
        query = "SELECT User.userName, subreply.subReplyId, subreply.parentReplyId, subreply.replyId, subreply.content, subreply.relationshipType, subreply.creationTime FROM websiteDatabase.subReply inner join User ON subreply.userId = User.userId WHERE replyId = %s and parentReplyId is NULL order by subreply.position asc;"
        cursor.execute(query, (replyid,))
        result = cursor.fetchall()
        for userName, subReplyId, parentReplyId, replyId, content, relationshipType, creationTime in result:
            query = "SELECT subReplyId FROM websiteDatabase.subReply WHERE subreply.parentReplyId = %s;"
            cursor.execute(query, (subReplyId,))
         
            childReplyPresent = len(cursor.fetchall())
            relType = ''
            if(relationshipType == 1):
                relType = "Evidence"
            elif(relationshipType == 2):
                relType = "Support"
            elif(relationshipType == 3):
                relType = "Rebuttal"
            subReplies.append({"username": escape(userName), "subReplyId": escape(subReplyId) ,"parentReplyId": escape(parentReplyId), "topReply": escape(replyId),"replyContent": escape(content), "relationship": escape(relType), "timeAdded": escape(creationTime), "childReplyPresent": escape(childReplyPresent)})      
    elif(replyType == "subReply"):
        query = "SELECT User.userName, subreply.subReplyId, subreply.parentReplyId, subreply.replyId, subreply.content, subreply.relationshipType, subreply.creationTime FROM websiteDatabase.subReply inner join User ON subreply.userId = User.userId WHERE subreply.parentReplyId = %s order by subreply.position asc;"
        cursor.execute(query, (replyid,))
        result = cursor.fetchall()
        for userName, subReplyId, parentReplyId, replyId, content, relationshipType, creationTime in result:
            query = "SELECT subReplyId FROM websiteDatabase.subReply WHERE subreply.parentReplyId = %s;"
            cursor.execute(query, (replyId,))
            childReplyPresent = len(cursor.fetchall())
            relType = ''
            if(relationshipType == 1):
                relType = "Evidence"
            elif(relationshipType == 2):
                relType = "Support"
            elif(relationshipType == 3):
                relType = "Rebuttal"
            subReplies.append({"username": escape(userName), "subReplyId": escape(subReplyId) ,"parentReplyId": escape(parentReplyId), "topReply": escape(replyId),"replyContent": escape(content), "relationship": escape(relType), "timeAdded": escape(creationTime), "childReplyPresent": escape(childReplyPresent)})
    
    
    
    jsonData.update({"replyType": escape(replyType)})
    jsonData.update({"subReplies": subReplies})
    return json.dumps(jsonData)

@app.route('/moveTopic', methods=["GET"])
def moveTopic():
    if session.get("login") is not None:
        userId = session["login"]
        cnx, cursor = dbConnect()
        admin = 0
        query = "select admin from User where User.userId = %s;"
        cursor.execute(query, (userId,))
        result = cursor.fetchone()
        for adminResult in result:
            admin = adminResult       
        if(admin == 1): 
            currentTopic = request.args.get("currentTopic")
            targetTopic = request.args.get("targetTopic")
            targetPosition = 0
            currentPosition = 0
            query = "select position from topic where topic.topicId = %s;"
            cursor.execute(query, (targetTopic, ))
            result = cursor.fetchone()
            if result is None:
                return json.dumps({"login": "true", "admin":"true", "move": "false", "currentId": escape(currentTopic)})
            for pos in result:
                targetPosition = pos
            query = "select position from topic where topic.topicId = %s;"
            cursor.execute(query, (currentTopic, ))
            result = cursor.fetchone()
            for pos in result:
                currentPosition = pos
            if(targetPosition < currentPosition):
                query = "update topic set topic.position = topic.position + 1 where topic.position >= %s and topic.position < %s;"
                cursor.execute(query, (targetPosition, currentPosition))
                cnx.commit()
            elif(currentPosition < targetPosition):
                query = "update topic set topic.position = topic.position - 1 where topic.position > %s and topic.position <= %s;"
                cursor.execute(query, (currentPosition, targetPosition,))
                cnx.commit()
            query = "update topic set topic.position = %s where topic.topicId = %s;"
            cursor.execute(query, (targetPosition, currentTopic, ))
            cnx.commit()       
            cnx.close()
            return json.dumps({"login": "true", "admin":"true", "move": "true", "currentId": escape(currentTopic)})
        else:
            return json.dumps({"login": "true", "admin":"false", "move": "false", "currentId": escape(currentTopic)})
    
    else:
        return json.dumps({"login": "false"})


@app.route('/moveClaim', methods=["GET"])
def moveClaim():
    
    #check admin and login
    if session.get("login") is not None:
        userId = session["login"]
        cnx, cursor = dbConnect()
        admin = 0
        query = "select admin from User where User.userId = %s;"
        cursor.execute(query, (userId,))
        result = cursor.fetchone()
        for adminResult in result:
            admin = adminResult       
        if(admin == 1): 
            currentClaim = request.args.get("currentClaim")
            targetClaim = request.args.get("targetClaim")
            targetPosition = 0
            currentPosition = 0
            currentTopic = ''
            query = "select position, topicId from claim where claim.claimId = %s;"
            cursor.execute(query, (targetClaim, ))
            result = cursor.fetchall()
            for pos, topicId in result:
                targetPosition = pos
                currentTopic = topicId        
            query = "select position from claim where claim.topicId = %s and claim.claimId = %s;"
            cursor.execute(query, (currentTopic, currentClaim,))
            result = cursor.fetchone()
            for pos in result:
                currentPosition = pos
            if(targetPosition < currentPosition):
                query = "update claim set claim.position = claim.position + 1 where claim.topicId = %s and claim.position >= %s and claim.position < %s;"
                cursor.execute(query, (currentTopic, targetPosition, currentPosition))
                cnx.commit()
            elif(currentPosition < targetPosition):
                query = "update claim set claim.position = claim.position - 1 where claim.topicId = %s and claim.position > %s and claim.position <= %s;"
                cursor.execute(query, (currentTopic, currentPosition, targetPosition,))
                cnx.commit()   
            query = "update claim set claim.position = %s where claim.claimId = %s;"
            cursor.execute(query, (targetPosition, currentClaim, ))
            cnx.commit()
            cnx.close()
            return json.dumps({"login": "true", "admin":"true", "move": "true", "currentId": escape(currentClaim)})
        else:
            return json.dumps({"login": "true", "admin":"false", "move": "false", "currentId": escape(currentClaim)})
    else:
        return json.dumps({"login": "false", "admin":"false", "move": "false", "currentId": escape(currentClaim)})

@app.route('/moveClaimTopic', methods=["GET"])
def moveClaimTopic():
    if session.get("login") is not None:
        userId = session["login"]
        cnx, cursor = dbConnect()
        #check admin and login
        admin = 0
        query = "select admin from User where User.userId = %s;"
        cursor.execute(query, (userId,))
        result = cursor.fetchone()
        for adminResult in result:
            admin = adminResult       
        if(admin == 1): 
            currentClaim = request.args.get("currentClaim")
            topicId = request.args.get("targetTopic")
            position = 0    
            query = "SELECT max(claim.position) FROM websiteDatabase.claim where claim.topicId = %s;"
            cursor.execute(query, (topicId,))
            result = cursor.fetchone()
            for maxPos in result:
                if maxPos is None:
                    position = 1
                else:
                    position = maxPos + 1               
            query = "update claim set claim.position = %s, claim.topicId = %s where claim.claimId = %s;"
            cursor.execute(query, (position, topicId, currentClaim,))
            cnx.commit()
            cnx.close()
            return json.dumps({"login": "true", "admin":"true", "move": "true", "currentId": escape(currentClaim)})
        else:
            return json.dumps({"login": "true", "admin":"false", "move": "false", "currentId": escape(currentClaim)})
    else:
        return json.dumps({"login": "false", "admin":"false", "move": "false", "currentId": escape(currentClaim)})
        
@app.route('/moveReply', methods=["GET"])
def moveReply():
    if session.get("login") is not None:
        userId = session["login"]
        cnx, cursor = dbConnect()
        #check admin and login
        admin = 0
        query = "select admin from User where User.userId = %s;"
        cursor.execute(query, (userId,))
        result = cursor.fetchone()
        for adminResult in result:
            admin = adminResult       
        if(admin == 1): 
            replyType = request.args.get("replyType")
            currentReply = request.args.get("currentReply")
            targetReply = request.args.get("targetReply")
            targetPosition = 0
            currentPosition = 0
            currentClaim = ''
            parentReplyId = ''
            if(replyType == "parent"):
                query = "select position, claimId from reply where reply.replyId = %s;"
                cursor.execute(query, (targetReply, ))
                result = cursor.fetchall()
                for pos, claimId in result:
                    targetPosition = pos
                    currentClaim = claimId
                query = "select position from reply where reply.claimId = %s and reply.replyId = %s;"
                cursor.execute(query, (currentClaim, currentReply,))
                result = cursor.fetchone()
                for pos in result:
                    currentPosition = pos            
                if(targetPosition < currentPosition):
                    query = "update reply set reply.position = reply.position + 1 where reply.claimId = %s and reply.position >= %s and reply.position < %s;"
                    cursor.execute(query, (currentClaim, targetPosition, currentPosition))
                    cnx.commit()
                elif(currentPosition < targetPosition):
                    query = "update reply set reply.position = reply.position - 1 where reply.claimId = %s and reply.position > %s and reply.position <= %s;"
                    cursor.execute(query, (currentClaim, currentPosition, targetPosition,))
                    cnx.commit()   
                query = "update reply set reply.position = %s where reply.replyId = %s;"
                cursor.execute(query, (targetPosition, currentReply, ))
                cnx.commit()
                currentReply = "reply" + currentReply
            elif(replyType == "ancestor"):
                query = "select position from subReply where subReply.subReplyId = %s;"
                cursor.execute(query, (currentReply,))
                result = cursor.fetchone()
                for pos in result:
                    currentPosition = pos  
                query = "select position, parentReplyId, replyId from subReply where subReply.subReplyId = %s;"
                cursor.execute(query, (targetReply, ))
                result = cursor.fetchall()     
                for pos, parentId, replyId in result:
                    targetPosition = pos            
                    if parentId is None:
                        parentReplyId = replyId
                        if(currentPosition > targetPosition):
                            query = "update subReply set subReply.position = subReply.position + 1 where subReply.parentReplyId is NULL and subReply.replyId = %s and subReply.position >= %s and subReply.position < %s;"
                            cursor.execute(query, (parentReplyId, targetPosition, currentPosition))
                            cnx.commit()
                        elif(targetPosition > currentPosition):
                            query = "update subReply set subReply.position = subReply.position - 1 where subReply.parentReplyId is NULL and subReply.replyId = %s and subReply.position > %s and subReply.position <= %s;"
                            cursor.execute(query, (parentReplyId, currentPosition, targetPosition,))
                            cnx.commit() 
                    else:
                        parentReplyId = parentId
                        if(targetPosition < currentPosition):
                            query = "update subReply set subReply.position = subReply.position + 1 where subReply.parentReplyId = %s and subReply.position >= %s and subReply.position < %s;"
                            cursor.execute(query, (parentReplyId, targetPosition, currentPosition))
                            cnx.commit()
                        elif(currentPosition < targetPosition):
                            query = "update subReply set subReply.position = subReply.position - 1 where subReply.parentReplyId = %s and subReply.position > %s and subReply.position <= %s;"
                            cursor.execute(query, (parentReplyId, currentPosition, targetPosition,))
                            cnx.commit()   
                query = "update subReply set subReply.position = %s where subReply.subReplyId = %s;"
                cursor.execute(query, (targetPosition, currentReply, ))
                cnx.commit()
                currentReply = "subReply" + currentReply        
            cnx.close()
            return json.dumps({"login": "true", "admin":"true", "move": "true", "currentId": escape(currentReply)})
        else:
            return json.dumps({"login": "true", "admin":"false", "move": "false", "currentId": escape(currentReply)})
            
    else:
        return json.dumps({"login": "false", "admin":"false", "move": "false", "currentId": escape(currentReply)})

@app.route('/deleteTopic', methods=["GET"])
def deleteTopic():
    topicId = request.args.get("topicId")
    if session.get("login") is not None:
        userId = session["login"]
        cnx, cursor = dbConnect()
        #check admin and login
        admin = 0
        query = "select admin from User where User.userId = %s;"
        cursor.execute(query, (userId,))
        result = cursor.fetchone()
        for adminResult in result:
            admin = adminResult       
        if(admin == 1): 
            query = "select claimId from claim where claim.topicId = %s";
            cursor.execute(query, (topicId,))
            claims = cursor.fetchall() 
            for cId in claims:
                claimId = cId[0]     
             
                query = "delete from claimRelationship where claimrelationship.claimId1 = %s or claimrelationship.claimId2 = %s;"
                cursor.execute(query, (claimId, claimId,))            
                query = "select replyId from reply where reply.claimId = %s";
                cursor.execute(query, (claimId,))
                replies = cursor.fetchall()     
                for rId in replies:
                    replyId = rId[0]
                    
                    #find all subreplies with the latest subreply iterated through first so the lowest subreply is deleted and no problems occur deleting records with foreign keys
                    query = "select subReplyId from subReply where subReply.replyId = %s order by subReply.creationTime desc";
                    cursor.execute(query, (replyId,))
                    subreplies = cursor.fetchall()
                    for srId in subreplies:
                        subReplyId = srId[0]
                        query = "delete from subReply where subReply.subReplyId = %s";
                        cursor.execute(query, (subReplyId,))
                    query = "delete from reply where reply.replyId = %s";
                    cursor.execute(query, (replyId,))
                query = "delete from claim where claim.claimId = %s;"
                cursor.execute(query, (claimId,))

            currentPosition = 0
            query = "select position from topic where topic.topicId = %s"
            cursor.execute(query, (topicId,))
            result = cursor.fetchone()
            for position in result:
                currentPosition = position
            query = "update topic set topic.position = topic.position - 1 where topic.position > %s;"
            cursor.execute(query, (currentPosition,))            
            query = "delete from topic where topic.topicId = %s";
            cursor.execute(query, (topicId,))
            cnx.commit()
            cnx.close()            
            return json.dumps({"login": "true", "admin": "true", "deleted": "true", "topicId": escape(topicId)})
        else:
            return json.dumps({"login": "true", "admin": "false", "deleted": "false", "topicId": escape(topicId)})
    else:
        return json.dumps({"login": "false", "admin": "false", "deleted": "false", "topicId": escape(topicId)})

@app.route('/deleteClaim', methods=["GET"])
def deleteClaim():
    claimId = request.args.get("claimId")
    if session.get("login") is not None:
        userId = session["login"]
        cnx, cursor = dbConnect()
        #check admin and login
        admin = 0
        query = "select admin from User where User.userId = %s;"
        cursor.execute(query, (userId,))
        result = cursor.fetchone()
        for adminResult in result:
            admin = adminResult       
        if(admin == 1):   
            query = "select replyId from reply where reply.claimId = %s";
            cursor.execute(query, (claimId,))
            replies = cursor.fetchall()
            for rId in replies:
                replyId = rId[0]
               
                #find all subreplies with the latest subreply iterated through first so the lowest subreply is deleted and no problems occur deleting records with foreign keys
                query = "select subReplyId from subReply where subReply.replyId = %s order by subReply.creationTime desc";
                cursor.execute(query, (replyId,))
                subreplies = cursor.fetchall()
                for srId in subreplies:
                    subReplyId = srId[0]
                    query = "delete from subReply where subReply.subReplyId = %s";
                    cursor.execute(query, (subReplyId,))
                query = "delete from reply where reply.replyId = %s";
                cursor.execute(query, (replyId,))
            currentPosition = 0
            currentTopic = 0
            query = "select topicId, position from claim where claim.claimId = %s"
            cursor.execute(query, (claimId,))
            result = cursor.fetchall()
            for topicId, position in result:
                currentTopic = topicId
                currentPosition = position
            query = "update claim set claim.position = claim.position - 1 where claim.topicId = %s and claim.position > %s;"
            cursor.execute(query, (currentTopic, currentPosition,))     
            query = "delete from claimRelationship where claimrelationship.claimId1 = %s or claimrelationship.claimId2 = %s;"
            cursor.execute(query, (claimId, claimId,))
            query = "delete from claim where claim.claimId = %s;"
            cursor.execute(query, (claimId,))
            cnx.commit()
            cnx.close()           
            return json.dumps({"login": "true", "admin": "true", "deleted": "true", "claimId": escape(claimId)})
        else:
            return json.dumps({"login": "true", "admin": "false", "deleted": "false", "claimId": escape(claimId)})
        
    else:
        return json.dumps({"login": "false", "admin": "false","deleted": "false", "claimId": escape(claimId)})

@app.route('/deleteReply', methods=["GET"])
def deleteReply():
    if session.get("login") is not None:
        userId = session["login"]
        cnx, cursor = dbConnect()
        #check admin and login
        admin = 0
        query = "select admin from User where User.userId = %s;"
        cursor.execute(query, (userId,))
        result = cursor.fetchone()
        for adminResult in result:
            admin = adminResult       
        if(admin == 1):      
            replyType = request.args.get("replyType")
            replyId = request.args.get("replyId")
            
            if(replyType == "parent"):
                query = "update reply set reply.content = %s where reply.replyId = %s;"
                cursor.execute(query, ('reply deleted', replyId,))
                replyId = "reply" + replyId
                
            elif(replyType == "ancestor"):
                query = "update subReply set subReply.content = %s where subReply.subReplyId = %s;"
                cursor.execute(query, ('reply deleted', replyId,))
                replyId = "subReply" + replyId
                
            cnx.commit()
            cnx.close()
            return json.dumps({"login": "true", "admin": "true", "deleted": "true", "replyId": escape(replyId)})
        else:           
            return json.dumps({"login": "true", "admin": "false", "deleted": "false", "replyId": escape(replyId)})
    else:
        return json.dumps({"login": "false", "admin": "false", "deleted": "false", "replyId": escape(replyId)})

    
@app.route('/assignAdmin', methods=["POST"])
def assignAdmin():
    if session.get("login") is not None:
        cnx, cursor = dbConnect()
        userId = session["login"]
        admin = 0
        query = "select admin from User where User.userId = %s;"
        cursor.execute(query, (userId,))
        result = cursor.fetchone()
        for adminResult in result:
            admin = adminResult       
        if(admin == 1):
            targetUser = request.form.get("adminAssign")
            query = "select userName from User where User.userName = %s;"
            cursor.execute(query, (targetUser,))
            userName = cursor.fetchone()
            if(userName is None):
                return json.dumps({"login": "true", "admin": "true", "successful": "false"})
            else:
                if(len(userName) == 1):
                    return json.dumps({"login": "true", "admin": "true", "successful": "true"})
                
        elif(admin == 0):
            return json.dumps({"login": "true", "admin": "false", "successful": "false"})
            
    else:
        return json.dumps({"login": "false", "admin": "false", "successful": "false"})

@app.route('/deleteUser', methods=["POST"])
def deleteUser():
    if session.get("login") is not None:
        cnx, cursor = dbConnect()
        userId = session["login"]
        admin = 0
        query = "select admin from User where User.userId = %s;"
        cursor.execute(query, (userId,))
        result = cursor.fetchone()
        for adminResult in result:
            admin = adminResult       
        if(admin == 1):
            targetUser = request.form.get("deleteUser")
            query = "select userName from User where User.userName = %s;"
            cursor.execute(query, (targetUser,))
            userName = cursor.fetchone()
            if(userName is None):
                return json.dumps({"login": "true", "admin": "true", "successful": "false"})
            else:
                if(len(userName) == 1):
                    return json.dumps({"login": "true", "admin": "true", "successful": "true"})
                
        elif(admin == 0):
            return json.dumps({"login": "true", "admin": "false", "successful": "false"})
            
    else:
        return json.dumps({"login": "false", "admin": "false", "successful": "false"})
     

@app.route('/confirmChanges', methods=["POST"])
def confirmChanges():    
    if session.get("login") is not None:
        cnx, cursor = dbConnect()
        userId = session["login"]
        admin = 0
        operations = []
        query = "select admin from User where User.userId = %s;"
        cursor.execute(query, (userId,))
        result = cursor.fetchone()
        for adminResult in result:
            admin = adminResult       
        if(admin == 1):
            userName = ''
              
                
            admin = adminResult       
            for adminCreate in request.form.getlist("adminCreate"):
                query = "select userName from User where User.userName = %s;"
                cursor.execute(query, (adminCreate,))
                result = cursor.fetchone()                     
                if(result is None):
                    operations.append({"keyword": escape(adminCreate),"action": "admin", "successful": "false"})

                elif(userName != "Deleted"):                   
                    query = "update User set User.admin = 1 where User.userName = %s;"
                    cursor.execute(query, (adminCreate,))
                    if cursor.rowcount == 1:
                        operations.append({"keyword": escape(adminCreate),"action": "admin", "successful": "true"})
                    elif cursor.rowcount == 0:
                        operations.append({"keyword": escape(adminCreate),"action": "admin", "successful": "false"})
                
                
            for deleteUser in request.form.getlist("deleteUser"):
                query = "select userName from User where User.userName = %s;"
                cursor.execute(query, (deleteUser,))
                result = cursor.fetchone()                  
                if(result is None):
                    operations.append({"keyword": escape(deleteUser),"action": "delete", "successful": "false"})
                elif(userName != "Deleted"):
                    query = "update user set user.Username = %s, passwordHash = %s where User.userName = %s;"
                    cursor.execute(query, ("Deleted", "", deleteUser,))                  
                    if cursor.rowcount == 1:
                        operations.append({"keyword": escape(deleteUser),"action": "delete", "successful": "true"})
                    elif cursor.rowcount == 0:
                        operations.append({"keyword": escape(deleteUser),"action": "delete", "successful": "false"})
                
            cnx.commit()
            cnx.close()
            return json.dumps({"login": "true", "admin": "true", "operations": operations})
           
        elif(admin == 0):
            cnx.close() 
            return json.dumps({"login": "true", "admin": "false"})
            
    else:
        return json.dumps({"login": "false", "admin": "false"})


@app.route('/search', methods=["POST"])
def search():
    searchResult = request.form.get("searchResult")
    searchFilter = request.form.get("filter")
    searchResult = searchResult.lower()
    resultList = searchResult.split()
    cnx, cursor = dbConnect()
    if searchFilter == "Topic":
        topics = []
        topicCheck =[]
        for i in resultList:
            query = "select topicId from Topic inner join User on User.userId = Topic.userId where Topic.topicName like %s or User.userName like %s;"
            cursor.execute(query, ("%" + i + "%","%"+ i + "%",))
            results = cursor.fetchall()
            for j in results:
                if j not in topicCheck:
                    identification = j[0]
                    topicCheck.append(identification)
                    topics.append({"id": escape(identification)})
        cnx.close()
        return json.dumps({"TopicData": topics})
    elif searchFilter == "Claim":
        claims = []
        claimCheck =[]
        for i in resultList:
            query = "select claimId from Claim inner join User on User.userId = Claim.userId where Claim.claimHeader like %s or Claim.content like %s or User.userName like %s;"
            cursor.execute(query, ("%" + i + "%","%"+ i + "%","%" + i + "%",))
            results = cursor.fetchall()
            for j in results:
                if j not in claimCheck:
                    identification = j[0]
                    claimCheck.append(identification)
                    claims.append({"id": escape(identification)})                

        cnx.close()
        return json.dumps({"ClaimData": claims})

  
    
    


@app.route('/liveUpdate', methods=["GET"])
def liveUpdate():
    updateType = request.args.get("updateType")
    jsonData = {}
    admin = 0    
    cnx, cursor = dbConnect()    
    if session.get("login") is not None:
        userId = session["login"]        
        query = "select admin  from websiteDatabase.user where userId = %s;"
        cursor.execute(query, (userId,))
        result = cursor.fetchone()
        admin = 0
        for administrator in result:
            admin = administrator
        cursor.fetchall()
        jsonData.update({"Login": "true"})
    elif session.get("login") is None:
        jsonData.update({"Login": "false"})        
    if(updateType == "topic"):           
        topicList = []
        query = "SELECT Topic.topicId, Topic.topicName, User.userName, Topic.creationTime FROM topic inner join User ON Topic.userId = User.userId order BY topic.position desc;"
        cursor.execute(query)
        result = cursor.fetchall()
        for topicId, topicName, userName, creationTime in result:
            topicList.append({"username": escape(userName), "topic": escape(topicName), "timeAdded": escape(creationTime), "id": escape(topicId)})    
        jsonData.update({"AdminStatus": escape(admin)})
        jsonData.update({"Topics": topicList})        
        cnx.close()    
        return json.dumps(jsonData)
    elif(updateType == "claimList"):
        claimList = []
        query = "SELECT Claim.claimId, Claim.claimHeader, User.userName, Claim.creationTime, Claim.topicId FROM Claim inner join User ON Claim.userId = User.userId order by topicId desc, position desc;"
        topicListId = request.args.get("currentId")        
        cursor.execute(query)
        result = cursor.fetchall()
        for claimId, claimHeader, userName, creationTime, topicId in result:
            claimList.append({"username": escape(userName), "claimHeader": escape(claimHeader), "timeAdded": escape(creationTime), "claimId": escape(claimId), "topicId": escape(topicId)})    
        jsonData.update({"AdminStatus": escape(admin)})
        jsonData.update({"ClaimList": claimList})        
        cnx.close() 
        return json.dumps(jsonData)
    elif(updateType == "claimPage"):        
        replies = []
        relationships = []
        query = "SELECT Claim.claimId, Claim.claimHeader, Claim.content, User.userName, Claim.creationTime FROM Claim inner join User ON Claim.userId = User.userId where Claim.claimId = %s;"
        ClaimListId = request.args.get("currentId")        
        cursor.execute(query,(ClaimListId,))
        result = cursor.fetchall()        
        jsonData.update({"AdminStatus": escape(admin)})
        for claimId, claimHeader, content, userName, creationTime in result:
            
            query = "SELECT claimrelationship.claimId2, claimrelationship.relationshipType FROM claimrelationship where claimrelationship.claimId1 = %s;"
            cursor.execute(query,(claimId,))
            claimRelations = cursor.fetchall()
            for relatedClaim, claimRelationType in claimRelations:
                relationships.append({"relatedClaim": escape(relatedClaim), "type": escape(claimRelationType)})
            jsonData.update({"ClaimId": escape(claimId)})
            jsonData.update({"ClaimAuthor": escape(userName)})
            jsonData.update({"ClaimContent":escape(content)})
            jsonData.update({"claimHeader" : escape(claimHeader)})
            jsonData.update({"timeAdded":escape(creationTime)})
        query = "SELECT User.userName, Reply.replyId, Reply.claimId, Reply.content, Reply.relationshipType, Reply.creationTime, subreply.parentReplyId, subreply.subReplyId FROM Reply inner join User ON Reply.userId = User.userId LEFT JOIN subreply ON Reply.replyId = subreply.replyId where Reply.claimId = %s order BY reply.position asc, subReply.parentReplyId, subReply.position asc;"
        cursor.execute(query,(ClaimListId,))
        result = cursor.fetchall()
        relType = ''
        for userName, replyId, claimId, content, relationshipType, creationTime, parentReplyId, subReplyId in result:
            if(relationshipType == 1):
                relType = "Clarification"
            elif(relationshipType == 2):
                relType = "Supporting Argument"
            elif(relationshipType == 3):
                relType = "Counterargument"
            replies.append({"username": escape(userName), "replyId" : escape(replyId),  "ClaimId": escape(claimId), "replyContent": escape(content), "relationship": escape(relType), "timeAdded" : escape(creationTime), "parentReply": escape(parentReplyId), "subReply": escape(subReplyId)})
        jsonData.update({"Replies": replies})        
        jsonData.update({"claimRelationship": relationships})
        cnx.close() 
        return json.dumps(jsonData)


        
