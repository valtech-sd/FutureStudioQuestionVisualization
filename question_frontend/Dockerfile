# Docker file with a multi-stage build process
# See this link for more info about docker multi-stage builds:
# https://docs.docker.com/develop/develop-images/multistage-build/

# ********************************************
# STAGE 1
# First, install the node dependencies and
# compile the typescript code
# ********************************************

# Start with a lightweight Linux distro (Alpine Linux)
# We call this stage ts-compiler so we can reference it
# in our other stages, if needed

# Built our app
FROM node:lts-alpine AS build-step

ARG ANSWER_HOST
ENV VUE_APP_ANSWER_HOST=$ANSWER_HOST

# Create app directory
# This is changing our working directory
# so all future commands will be performed here.
# We've bound this directory as a volume to our
# repository's root, so our docker has access to
# all of our repo's files. Note that volume binding
# is read-only, so we cannot write out files.

RUN apk add --no-cache bash

WORKDIR /home/node/app

RUN chown node:node /home/node/app

# Set user to non-root "node"
# This ensures that any files created
# will be accessible to non-root users and programs
USER node

# Copy the frontend
COPY --chown=node:node ./question_frontend frontend

# Change ownership to non-root user
# so a non-root user can do things!
RUN chown node:node frontend

WORKDIR /home/node/app/frontend

# Install our node dependencies!
RUN npm install

# Build application using the script defined in package.json
# This will place our built website files into the build/ directory
RUN npm run build

# This results in an image with our website

## ********************************************
## STAGE 2
## Deploying our simple website in an Nginx Docker
## This will not include all the cruft we need to build our code
## Just the bare minimum - built files and nginx!
## ********************************************
#
## Start from the vanilla nginx Docker container
FROM nginx

## Copy the built files from build-step to the place where nginx
## expects to find the files to serve up!
COPY --from=build-step /home/node/app/frontend/dist /usr/share/nginx/html

# for regular http
EXPOSE 80
