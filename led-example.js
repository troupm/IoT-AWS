const awsIot = require('aws-iot-device-sdk');
const ThingHost = 'a3knx5ouu01ymf-ats.iot.us-east-1.amazonaws.com';
const KeyPath = 'AIL_IoT_RPi_01.private.key';
const CertPath = 'AIL_IoT_RPi_01.cert.pem';
const CaPath = 'root-CA.crt';
const ThingName = 'AIL_IoT_RPi_01';
const Port = 8883;
const Region = 'us-east-1';

var ledToggle = false;
console.log("Defining GPIO...");
var GPIO = require("pi-pins");
console.log("Attaching LED Pin...");
var led= GPIO.connect(12);
console.log("Setting LED mode...");
led.mode('out');
console.log("Swithing LED off...");
led.value(false);

console.log("Defining deviceModule...");
var deviceModule = awsIot.device;
console.log("Defining AWS shadowModule...");
var shadowModule = awsIot.IotData;

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
    region: Region
});

console.log("Defining AWS Thing Shadow...");
// see aws-iot-device-sdk for details about thingShadow setup
const thingShadow = awsIot.thingShadow({
  region: Region,
  clientId: ThingName,
  //protocol: 'wss',
  maximumReconnectTimeMs: 3000,
  keyPath: KeyPath,
  certPath: CertPath,
  caPath: CaPath,
  clientId: ThingName,
  port: Port, 
  host: ThingHost,
  region: Region
});

device.on('connect', function() {
    console.log("Subcribing to topic LED...");
    device.subscribe('LED');
    console.log("Subcribing to topic Delta...");
    device.subscribe(`aws/things/${ThingName}/shadow/update/delta`);
    console.log("Registering AWS Thing Shadow...");
    thingShadow.register(ThingName);
});

device.on('message', function(topic, payload) 
{
    console.log("Message received from Topic LED. Processing...");
    console.log("Payload dump:");
    var payload = JSON.parse(payload.toString());
    //show the incoming message
    console.log(payload.light);
    if(topic == `aws/things/${ThingName}/shadow/update/delta`)
    {
        if(payload.delta && payload.delta.light === 'on')
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
        } 
        else if (payload.delta && payload.delta.light == 'off')
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
        }
    }
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
        }
    }
});


