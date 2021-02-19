# README.MD - FutureStudioQuestionVisualization
## What is this?

This project was created to present a "question" to a group of people (via a web page), then to collect answers to the question. Then a moderator uses a tool (Infranodus) to produce a visualization of how those answers related to each other. 
The solution relies the following technologies:
* Docker Compose to allow for standing up a stack quickly with various sub-systems.
* Nginx to host the question page.
* RabbitMQ to collect the survey answers at any scale without impacting the visualization tool.
* NodeJS is used for the RabbitMQ consumer and batch importer into Infranodus.
* Infranodus is used for the visualization. Infranodus is an open source project self-described as "... a text-to-network visualization tool, based on Neo4J, Node.Js and Sigma.Js.". Learn more about Infranodus here: https://github.com/noduslabs/infranodus. Note, a few modifications were made to Infranodus, specifically to address some API issues. These have not yet been sent upstream to that project, but are part of this repo.

## Dependencies

This project requires Docker and docker-compose. All other dependencies are included in the repo.

## HOW TO USE THIS

To quickly start using this project do the following
1. Install docker and docker-compose if it is not already installed. Docker desktop contains both tools if you are using MacOS or Windows 10
1. Run `unzip neo4j-data.zip` to get the initial Neo4J database setup
1. Navigate to the root directory and run `docker-compose build` 
1. Navigate to the root directory and run `docker-compose up -d` 
1. Navigate to [http://localhost:8080](http://localhost:8080) to view the question
1. Navigate to [http://localhost:3020](http://localhost:3020) to view question graph. 

	```
	 Username: valtech
	 Password: isthebest
	```

## Where to go next with this project
* Fork Infranodus and submit a PR upstream to bring in some of our tweaks to their api.
* Implement better linking of the Infranodus project, possibly even at a specific version (or fork). Right now it's a static copy of the project's master branch as of Feb 2021 + a few modifications to their API code.
* Adding automated testing.
* This project is setup to use localhost so a lot of secrets are stored in the docker-compose.yml file. For a PROD/PUBLIC setup, this project should implement the proper separation of secrets that are not included in the repo. Most of the internal services (RabbitMQ and NodeJS) are not exposed publicly, but still it would be better. However, for the two Nginx exposed services (the question form and the Infranodus UI) there should be better password security than hardcoded here.
* The instructions on how to setup NEO4J from scratch (without using the data zip) could use a bit of tweaking and testing.

## License (excluding Infranodus)

Copyright © 2021 Valtech
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## License (Infranodus)

Infranodus uses an AGPLv3 license, included here by reference. For full details, please refer to the Infranodus license at https://github.com/noduslabs/infranodus#gpl-license.
