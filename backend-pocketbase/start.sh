#!/bin/sh
./pocketbase migrate up --dir pb_data
./pocketbase serve --http=0.0.0.0:8090 --dir pb_data