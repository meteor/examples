#!/usr/bin/env bash

authFileAndroid=~/android_auth.json

fastlane supply --aab ~/app-release.aab --json_key $authFileAndroid --package_name $APP_ID
