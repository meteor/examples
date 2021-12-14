#!/usr/bin/env bash

# fill the data here
fastlaneApplePassword=yourpass
appleUsername=yourusername
applePassword=yourpassword

# testflight:true
FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD=$fastlaneApplePassword FL_UNLOCK_KEYCHAIN_SET_DEFAULT=true bundle exec fastlane --verbose ios appstore username:$appleUsername password:$applePassword
