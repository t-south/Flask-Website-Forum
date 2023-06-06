-- MySQL dump 10.13  Distrib 8.0.23, for Win64 (x86_64)
--
-- Host: localhost    Database: websitedatabase
-- ------------------------------------------------------
-- Server version	8.0.23

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `claim`
--

DROP TABLE IF EXISTS `claim`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `claim` (
  `claimId` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `topicId` int NOT NULL,
  `claimHeader` varchar(100) NOT NULL,
  `content` varchar(2000) NOT NULL,
  `creationTime` datetime NOT NULL,
  `position` int NOT NULL,
  PRIMARY KEY (`claimId`),
  KEY `userId` (`userId`),
  KEY `topicId` (`topicId`),
  CONSTRAINT `claim_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`userId`),
  CONSTRAINT `claim_ibfk_2` FOREIGN KEY (`topicId`) REFERENCES `topic` (`topicId`)
) ENGINE=InnoDB AUTO_INCREMENT=242 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `claim`
--

LOCK TABLES `claim` WRITE;
/*!40000 ALTER TABLE `claim` DISABLE KEYS */;
/*!40000 ALTER TABLE `claim` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `claimrelationship`
--

DROP TABLE IF EXISTS `claimrelationship`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `claimrelationship` (
  `claimId1` int NOT NULL,
  `claimId2` int NOT NULL,
  `relationshipType` tinyint DEFAULT NULL,
  PRIMARY KEY (`claimId1`,`claimId2`),
  KEY `claimId2` (`claimId2`),
  CONSTRAINT `claimrelationship_ibfk_1` FOREIGN KEY (`claimId1`) REFERENCES `claim` (`claimId`),
  CONSTRAINT `claimrelationship_ibfk_2` FOREIGN KEY (`claimId2`) REFERENCES `claim` (`claimId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `claimrelationship`
--

LOCK TABLES `claimrelationship` WRITE;
/*!40000 ALTER TABLE `claimrelationship` DISABLE KEYS */;
/*!40000 ALTER TABLE `claimrelationship` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reply`
--

DROP TABLE IF EXISTS `reply`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reply` (
  `replyId` int NOT NULL AUTO_INCREMENT,
  `claimId` int NOT NULL,
  `userId` int NOT NULL,
  `content` varchar(500) NOT NULL,
  `relationshipType` tinyint NOT NULL,
  `creationTime` datetime NOT NULL,
  `position` int NOT NULL,
  PRIMARY KEY (`replyId`),
  KEY `claimId` (`claimId`),
  KEY `userId` (`userId`),
  CONSTRAINT `reply_ibfk_1` FOREIGN KEY (`claimId`) REFERENCES `claim` (`claimId`),
  CONSTRAINT `reply_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `user` (`userId`)
) ENGINE=InnoDB AUTO_INCREMENT=132 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reply`
--

LOCK TABLES `reply` WRITE;
/*!40000 ALTER TABLE `reply` DISABLE KEYS */;
/*!40000 ALTER TABLE `reply` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subreply`
--

DROP TABLE IF EXISTS `subreply`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subreply` (
  `subReplyId` int NOT NULL AUTO_INCREMENT,
  `parentReplyId` int DEFAULT NULL,
  `replyId` int NOT NULL,
  `userId` int NOT NULL,
  `content` varchar(500) NOT NULL,
  `relationshipType` tinyint NOT NULL,
  `creationTime` datetime NOT NULL,
  `position` int NOT NULL,
  PRIMARY KEY (`subReplyId`),
  KEY `childReplyId` (`parentReplyId`),
  KEY `replyId` (`replyId`),
  KEY `userId` (`userId`),
  CONSTRAINT `subreply_ibfk_1` FOREIGN KEY (`parentReplyId`) REFERENCES `subreply` (`subReplyId`),
  CONSTRAINT `subreply_ibfk_2` FOREIGN KEY (`replyId`) REFERENCES `reply` (`replyId`),
  CONSTRAINT `subreply_ibfk_3` FOREIGN KEY (`userId`) REFERENCES `user` (`userId`)
) ENGINE=InnoDB AUTO_INCREMENT=347 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subreply`
--

LOCK TABLES `subreply` WRITE;
/*!40000 ALTER TABLE `subreply` DISABLE KEYS */;
/*!40000 ALTER TABLE `subreply` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `topic`
--

DROP TABLE IF EXISTS `topic`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `topic` (
  `topicId` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `topicName` varchar(50) NOT NULL,
  `creationTime` datetime NOT NULL,
  `position` int NOT NULL,
  PRIMARY KEY (`topicId`),
  KEY `userId` (`userId`),
  CONSTRAINT `topic_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`userId`)
) ENGINE=InnoDB AUTO_INCREMENT=266 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `topic`
--

LOCK TABLES `topic` WRITE;
/*!40000 ALTER TABLE `topic` DISABLE KEYS */;
/*!40000 ALTER TABLE `topic` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `userId` int NOT NULL AUTO_INCREMENT,
  `userName` varchar(10) NOT NULL,
  `passwordHash` varchar(120) NOT NULL,
  `admin` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`userId`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (48,'admin123','1ae590ce325d15eea03a9b6768e23c5d6c71f59939c1b1f6456d4b857086fceb',1);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2021-05-05 18:27:45
