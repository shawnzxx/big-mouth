#!/bin/bash
set -e
set -o pipefail

instruction()
{
  echo "usage: ./build.sh deploy <env>"
  echo ""
  echo "env: eg. int, staging, prod, ..."
  echo ""
  echo "for example: ./deploy.sh int"
}

if [ $# -eq 0 ]; then
  instruction
  exit 1

# ie: build.sh int-test
elif [ "$1" = "int-test" ] && [ $# -eq 1 ]; then    
  npm install

  npm run integration-test

# ie: build.sh acceptance-test
elif [ "$1" = "acceptance-test" ] && [ $# -eq 1 ]; then
  npm install

  npm run acceptance-test

# build.sh deploy dev
elif [ "$1" = "deploy" ] && [ $# -eq 2 ]; then
  STAGE=$2

  npm install
  'node_modules/serverless/bin/serverless' deploy -s $STAGE

else
  instruction
  exit 1
fi