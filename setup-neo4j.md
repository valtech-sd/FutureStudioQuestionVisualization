# README - NEO4J Setup

> **Note:** This repository should contain a starter ZIP that already provides an initialized NEO4J environment. However, in case it does not, the below are useful notes for creating a NEO4J environment suitable for Infranodus.

## Version Supported

The Infranodus used in this project seems to work well with Neo4J v 3.5. The the latest in the v3.x tree is here:
https://github.com/neo4j-contrib/neo4j-apoc-procedures/releases/download/3.5.0.15/apoc-3.5.0.15-all.jar

## Copy these to NEO4J CLI and run

These have been tested with NEO 3.5.
The APOC plugin must be in the Plugin directory.

```text
CREATE INDEX ON :User(name);
CREATE INDEX ON :User(uid);
CREATE INDEX ON :Concept(name);
CREATE INDEX ON :Concept(uid);
CREATE INDEX ON :Context(name);
CREATE INDEX ON :Context(uid);
CREATE INDEX ON :Context(by);
CREATE INDEX ON :Statement(name);
CREATE INDEX ON :Statement(uid);
CALL apoc.trigger.add('RELATIONSHIP_INDEX',"UNWIND {createdRelationships} AS r MATCH ()-[r]->() CALL apoc.index.addRelationship(r,['user','context','statement','gapscan']) RETURN count(*)", {phase:'after'});
CALL apoc.trigger.add('RELATIONSHIP_INDEX_REMOVE_TO',"UNWIND {deletedRelationships} AS r MATCH ()-[r:TO]->() CALL apoc.index.removeRelationshipByName('TO',r) RETURN count(*)", {phase:'after'});
CALL apoc.trigger.add('RELATIONSHIP_INDEX_REMOVE_AT',"UNWIND {deletedRelationships} AS r MATCH ()-[r:AT]->() CALL apoc.index.removeRelationshipByName('AT',r) RETURN count(*)", {phase:'after'});
CALL apoc.trigger.add('RELATIONSHIP_INDEX_REMOVE_BY',"UNWIND {deletedRelationships} AS r MATCH ()-[r:BY]->() CALL apoc.index.removeRelationshipByName('BY',r) RETURN count(*)", {phase:'after'});
CALL apoc.trigger.add('RELATIONSHIP_INDEX_REMOVE_OF',"UNWIND {deletedRelationships} AS r MATCH ()-[r:OF]->() CALL apoc.index.removeRelationshipByName('OF',r) RETURN count(*)", {phase:'after'});
CALL apoc.trigger.add('RELATIONSHIP_INDEX_REMOVE_IN',"UNWIND {deletedRelationships} AS r MATCH ()-[r:IN]->() CALL apoc.index.removeRelationshipByName('IN',r) RETURN count(*)", {phase:'after'});
```
