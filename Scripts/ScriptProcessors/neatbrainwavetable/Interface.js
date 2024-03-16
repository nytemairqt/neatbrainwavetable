Content.makeFrontInterface(600, 600);

// GLOBALS

const SAMPLERATE = 44100.0;
reg PENDING = false;
const MIDDLE_C = 261.63;
const ROOT = FileSystem.getFolder(FileSystem.AudioFiles);
const EXTRACTED = ROOT.getChildFile("extracted");
reg TARGET = 440.0;
const keyRange = [12, 17, 22, 27, 32, 37, 42, 47, 52, 57, 62, 67, 72, 77, 82, 88];

// Instantiate Loris Engine

const worker = Engine.createBackgroundTask("Loris Processor");
worker.setTimeOut(10000);
worker.setForwardStatusToLoadingThread(true);

const lorisManager = Engine.getLorisManager();
lorisManager.set("timedomain", "0to1");
lorisManager.set("enablecache", "false");

// Repitch Buffer
inline function repitch(obj)
{
	local ratio = TARGET / obj.rootFrequency;
	obj.frequency *= ratio;	
}

// Save Audio To File
inline function saveAudio(path, buffer)
{
	path.writeAudioFile(buffer, SAMPLERATE, 24);
}

// Abort Process
inline function abort()
{
	worker.setProgress(0.0);
	worker.setStatusMessage("Cancel");
	PENDING = false;	
	return;
}

// Extract & Resynthesize
function extractWavetable(file, targetPitch, targetNoteNumber)
{
	// Initialize
	PENDING = true;	
	if (worker.shouldAbort())
		abort();
	worker.setStatusMessage("Analyzing");
	worker.setProgress(0.05);		
	var wt;
	var buffer = file.loadAsAudioFile();
	var f0;		
	var output = [];

	// Analyze
	f0 = buffer.detectPitch(SAMPLERATE, buffer.length * 0.2, buffer.length * 0.6);			
	lorisManager.analyse(file, f0);	
	
	// Repitch
	TARGET = targetPitch;
	lorisManager.processCustom(file, repitch);
	
	// Resynthesize
	wt = lorisManager.synthesise(file);	
	wt = wt[0]; // Get the Buffer
	
	// Trim Buffer, 0.2s should be plenty
	//for (i=0; i<wt.length; i++) // KEEP ME
	for (i=0; i<10000; i++) // KEEP ME
	{
		output.push(wt[i]);
	}
			
	// Write to Audio File	
	var fileName = Math.round(targetPitch) + "hz_" + targetNoteNumber + "_" + file.toString(3);
	var path = EXTRACTED.getChildFile(fileName);	
	saveAudio(path, output);	
	Console.print("Wrote to file");
	
	// End Worker
	worker.setProgress(1.0);
	PENDING = false;
}

// Press the big red button
inline function onButton1Control(component, value)
{
	if (value)
	{
		local audioFiles = FileSystem.findFiles(ROOT, "*.wav", false);
		
		for (i=0; i<audioFiles.length; i++)
		{
			for (j=0; j<keyRange.length; j++)
			{
				Console.clear();

				local hz = Engine.getFrequencyForMidiNoteNumber(keyRange[j]);
				extractWavetable(audioFiles[i], hz, keyRange[j]);		
				
				Console.print("Audio File: " + (i+1) + "/" + audioFiles.length);
				Console.print("Wavetable: " + (j+1) + "/" + keyRange.length);
			}			
		}
		
	Console.clear();
	Console.print("Finished extracting Wavetables.");
	}	
};

Content.getComponent("Button1").setControlCallback(onButton1Control);



function onNoteOn()
{
	
}
 function onNoteOff()
{
	
}
 function onController()
{
	
}
 function onTimer()
{
	
}
 function onControl(number, value)
{
	
}
 