#!/usr/bin/env bash

# fill the data here
env=production
appName=Mobile
buildFolder=meteor-mobile-build-production
host=https://mobile.meteorapp.com
pathToAndroidKeyStore=/Users/filipe/Documents/meteor/ws/mobile/keystore
androidPassword=asdWEQdsaD
keystoreAlias=$APP_ID

# build
cd ../../../
rm -rf .meteor/local/cordova-build
rm -rf ../../$buildFolder
echo building app pointing to $host
METEOR_DISABLE_OPTIMISTIC_CACHING=1 LANG=en_US.UTF-8 MOBILE_APP_ID=$APP_ID meteor build ../../$buildFolder --server=$host --mobile-settings private/env/$env/settings.json

cd ../../$buildFolder

# open xcode
open ios/project/$appName.xcworkspace

# sign android
cd android/project/app/build/outputs/bundle/release
rm -rf ~/app-release.aab
echo 'Executing: jarsigner'
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore $pathToAndroidKeyStore --storepass $androidPassword app-release.aab $keystoreAlias
cp app-release.aab ~/app-release.aab
