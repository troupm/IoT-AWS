const awsIot = require('aws-iot-device-sdk');
const uuid = require('uuid');
const ThingHost = 'a3knx5ouu01ymf-ats.iot.us-east-1.amazonaws.com';
const KeyPath = 'AIL_IoT_RPi_01.private.key';
const CertPath = 'AIL_IoT_RPi_01.cert.pem';
const CaPath = 'root-CA.crt';
//const ThingName = `AIL_IoT_RPi_01${uuid.v4()}`;
const ClientToken = uuid.v4().toString();
const ThingName = `AIL_IoT_RPi_01`;
const Port = 8883;
const Region = 'us-east-1';
const pressCount= 0;

var ledToggle = false;
var connected = false;
console.log("Defining GPIO...");
var GPIO = require("pi-pins");

// BUTTONS
/*
var onButton= GPIO.connect(17);
onButton.mode('in');
var offButton= GPIO.connect(18);
offButton.mode('in');

onButton.on('rise', function () {
    console.log("ON button pressed-- publishing light:on message to topic LED with QOS=1");
    console.log("TODO: Publish MQTT Message here");
});

offButton.on('rise', function () {
    console.log("OFF button pressed-- publishing light:off message to topic LED with QOS=1");
    console.log("TODO: Publish MQTT Message here");
});
*/

// LEDs
console.log("Attaching LED Pin...");
var led= GPIO.connect(12);
console.log("Setting LED mode...");
led.mode('out');
console.log("Swithing LED off...");
led.value(false);

console.log("Defining deviceModule...");
var deviceModule = awsIot.device;

// console.log("Defining AWS shadowModule...");
// var shadowModule = awsIot.IotData;

/*
var interval = setInterval(()=>
{
    ledToggle = !ledToggle;
    console.log("Changing LED state...");
    led.value(ledToggle);
}
, 500);
setTimeout(()=>clearInterval(interval),10000);
*/

console.log("Initializing AWS Device...");
var device = deviceModule({
    keyPath: KeyPath,
    certPath: CertPath,
    caPath: CaPath,
    clientId: ThingName,
	port: Port,
	host: ThingHost,
    region: Region,
    offlineQueueing: true,
    autoResubscribe: true
});

console.log("Defining AWS Thing Shadow...");
// see aws-iot-device-sdk for details about thingShadow setup
const thingShadow = awsIot.thingShadow({
  region: Region,
  clientId: ThingName,
  //protocol: 'wss',
  maximumReconnectTimeMs: 3000,
//   operationTimeout: 30000,
  keyPath: KeyPath,
  certPath: CertPath,
  caPath: CaPath,
  clientId: ThingName,
  port: Port, 
  host: ThingHost,
  region: Region, 
});

device.on('connect', function() {
    if(!connected)
    {
        console.log("OnConnect event: ** CONNECTING... **");
        console.log("Subcribing to topic LED...");
        device.subscribe('LED');
        console.log("Subcribing to topic Delta...");
        device.subscribe(`aws/things/${ThingName}/shadow/update/delta`);
        console.log("Registering AWS Thing Shadow...");
        thingShadow.register(ThingName, {
            persistentSubscribe: true
        });
        connected = true;
        console.log("** CONNECTED **");
    }
    else{
        console.log("OnConnect event: already connected.");
    }
});

device.on('offline', function () {
    console.log("MQTT offline");
});
 
device.on('reconnect', function () {
    console.log("MQTT reconnecting");
});

device.on('close', function () {
    console.log("MQTT closed");
});

// SHADOW EVENTS

thingShadow.on('connect', function() {
    //
    // After connecting to the AWS IoT platform, register interest in the
    // Thing Shadow named 'RGBLedLamp'.
    //
    thingShadow.register( ThingName, {}, function() {
        console.log('thingShadow.register : Registering...');
    // Once registration is complete, update the Thing Shadow named
    // 'RGBLedLamp' with the latest device state and save the clientToken
    // so that we can correlate it with status or timeout events.
    //
    // Thing shadow state
    //
           var ledState = {"state":{"desired":{"light":"on"}}};
    
           clientTokenUpdate = thingShadow.update(ThingName, ledState  );
    //
    // The update method returns a clientToken; if non-null, this value will
    // be sent in a 'status' event when the operation completes, allowing you
    // to know whether or not the update was successful.  If the update method
    // returns null, it's because another operation is currently in progress and
    // you'll need to wait until it completes (or times out) before updating the 
    // shadow.
    //
           if (clientTokenUpdate === null)
           {
              console.log('update shadow failed, operation still in progress');
           }
           else{
            console.log('thingShadow.register : thingShadow registered sucessully.');
           }
        });
    });

    thingShadow.on('status', 
    function(thingName, stat, clientToken, stateObject) {
       console.log('received '+stat+' on '+thingName+': '+
                   JSON.stringify(stateObject));
    //
    // These events report the status of update(), get(), and delete() 
    // calls.  The clientToken value associated with the event will have
    // the same value which was returned in an earlier call to get(),
    // update(), or delete().  Use status events to keep track of the
    // status of shadow operations.
    //
    });

    thingShadow.on('delta', 
        function(thingName, stateObject) {
        console.log('received delta on '+thingName+': '+
                    JSON.stringify(stateObject));
        if(stateObject.state && stateObject.state.light === 'on')
        {
            console.log("Swithing LED on...");
            led.value(true);
            // update shadow
            thingShadow.update(ThingName, {
                state: {
                reported: {
                    light: 'on'
                }
                }
            })
            console.log("Thing Shadow Updated");
            console.log(thingShadow);
        } 
        if(stateObject.state && stateObject.state.light === 'off')
        {
            console.log("Swithing LED off...");
            led.value(false);
            thingShadow.update(ThingName, {
                state: {
                reported: {
                    light: 'off'
                }
                }
            })
            console.log("Thing Shadow Updated");
            console.log(thingShadow);
        }
        });

    thingShadow.on('timeout',
        function(thingName, clientToken) {
        console.log('received timeout on '+thingName+
                    ' with token: '+ clientToken);
    //
    // In the event that a shadow operation times out, you'll receive
    // one of these events.  The clientToken value associated with the
    // event will have the same value which was returned in an earlier
    // call to get(), update(), or delete().
    });

// DEVICE EVENTS

device.on('message', function(topic, payload) 
{
    console.log("Message received from Topic LED. Processing...");
    console.log("Payload dump:");
    var payload = JSON.parse(payload.toString());
    //show the incoming message
    console.log(payload.light);

    // if(topic == `aws/things/${ThingName}/shadow/update/delta`)
    // {
    //     if(payload.delta && payload.delta.light === 'on')
    //     {
    //         console.log("Swithing LED on...");
    //         led.value(true);
    //         // update shadow
    //         thingShadow.update(ThingName, {
    //             state: {
    //             reported: {
    //                 light: 'on'
    //             }
    //             }
    //         })
    //         console.log("Thing Shadow Updated");
    //         console.log(thingShadow);
    //     } 
    //     else if (payload.delta && payload.delta.light == 'off')
    //     {
    //         console.log("Swithing LED off...");
    //         led.value(false);
    //         thingShadow.update(ThingName, {
    //             state: {
    //             reported: {
    //                 light: 'off'
    //             }
    //             }
    //         })
    //         console.log("Thing Shadow Updated");
    //         console.log(thingShadow);
    //     }
    // }

    if(topic == 'LED')
    {
        if(payload.light == 'on')
        {
            console.log("Swithing LED on...");
            led.value(true);
            // update shadow
            thingShadow.update(ThingName, {
                state: {
                reported: {
                    light: 'on'
                }
                }
            })
            console.log("Thing Shadow Updated");
            console.log(thingShadow);
        } 
        else 
        {
            console.log("Swithing LED off...");
            led.value(false);
            thingShadow.update(ThingName, {
                state: {
                reported: {
                    light: 'off'
                }
                }
            });
            console.log("Thing Shadow Updated");
            console.log(thingShadow);
        }
    }
});


