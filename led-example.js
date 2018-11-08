var awsIot = require('aws-iot-device-sdk');
const thingHost = 'a3knx5ouu01ymf-ats.iot.us-east-1.amazonaws.com';

//var rpio = require('rpio');
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

//rpio.write(12, rpio.HIGH);
var interval = setInterval(()=>
{
    ledToggle = !ledToggle;
    console.log("Changing LED state...");
    led.value(ledToggle);
}
, 500);
setTimeout(()=>clearInterval(interval),10000);

console.log("Defining AWS Device...");
var device = awsIot.device({
    keyPath: 'AIL_IoT_RPi_01.private.key',
    certPath: 'AIL_IoT_RPi_01.cert.pem',
    caPath: 'root-CA.crt',
    clientId: 'AIL_IoT_RPi_01',
	port: 8883,
	host: thingHost,
    region: 'us-east-1'
});

/*
console.log("Defining AWS Thing Shadow...");
var shadow = awsIot.IotData({endpoint: thingHost});
console.log("Getting Thing Shadow from AWS...");
shadow.getThingShadow(params, function (err, data) {
  if (err) console.log(err, err.stack); // an error occurred
  else     console.log(data);           // successful response
});
*/

console.log("Subcribing to topic LED...");
device.on('connect', function() {
    device.subscribe('LED');
});

device.on('message', function(topic, payload) 
//(topic, payload)=>
{
    console.log("Message received from Topic LED. Processing...");
    console.log("Payload dump:");
    var payload = JSON.parse(payload.toString());
    //show the incoming message
    console.log(payload.light);
    if(topic == 'LED')
    {
        if(payload.light == 'on')
        {
            console.log("Swithing LED on...");
            led.value(true);
        } 
        else 
        {
            console.log("Swithing LED off...");
            led.value(false);
        }
    }
});

