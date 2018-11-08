var awsIot = require('aws-iot-device-sdk');

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

//rpio.write(12, rpio.HIGH);
var interval = setInterval(()=>
{
    ledToggle = !ledToggle;
    console.log("Changing LED state...");
    led.value(ledToggle);
}
, 500);
setTimeout(()=>clearInterval(interval),10000);

var device = awsIot.device({
    keyPath: '/home/pi/certs/private.pem.key',
    certPath: '/home/pi/certs/certificate.pem.crt',
    caPath: '/home/pi/certs/caCert.crt',
    clientId: 'AIL_IoT_RPi_01',
    region: 'us-east-1'
});

//var st = `${device} fkjholjflksdjf`;

device.on('connect', function() {
    device.subscribe('LED');
});

device.on('message', function(topic, payload) 
//(topic, payload)=>
{
    console.log("Message received from Topic LED. Processing...");
    var payload = JSON.parse(payload.toString());
    //show the incoming message
    console.log(payload.light);
    if(topic == 'LED')
    {
        if(payload.light == 'on')
        {
            console.log("Swithing LED off...");
            led.value(true);
        } 
        else 
        {
            console.log("Swithing LED off...");
            led.value(false);
        }
    }
});
