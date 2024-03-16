Content.makeFrontInterface(600, 600);

// GLOBALS
const SAMPLERATE = 44100.0;
reg PENDING = false;
const MIDDLE_C = 261.63;
const ROOT = FileSystem.getFolder(FileSystem.AudioFiles);
const SAMPLES = FileSystem.getFolder(FileSystem.Samples);
const WAVETABLES = SAMPLES.getChildFile("wavetables");
reg TARGET = 440.0;
const keyRange = [12, 17, 22, 27, 32, 37, 42, 47, 52, 57, 62, 67, 72, 77, 82, 88];

// Instantiate Loris Engine
const worker = Engine.createBackgroundTask("Loris Processor");
worker.setTimeOut(10000);
worker.setForwardStatusToLoadingThread(true);

const lorisManager = Engine.getLorisManager();
lorisManager.set("timedomain", "0to1");
lorisManager.set("enablecache", "false");

// Print
inline function print(stringToPrint)
{
	if (isDefined(stringToPrint.length))
	{
		for (str in stringToPrint)
		{
			Console.print(str);
		}
	}
	else
	{
		Console.print(stringToPrint);
	}
}

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
function extractWavetable(file, targetPitch, targetNoteNumber, rrGroup, vl, vh)
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
	
	// Current Format: rootHz_rootKeyNum_RRGroup_articulation.wav
	// ideal format: hz{}_root{}_rr{}_vl{}_vh{}_petName.wav
	var fileName = "hz" + Math.round(targetPitch) + "_root" + targetNoteNumber + "_rr" + rrGroup + "_vl" + vl + "_vh" + vh + "_" + file.toString(3);
	var path = WAVETABLES.getChildFile(fileName);	
	saveAudio(path, output);	
	Console.print("Wrote to file");
	
	// End Worker
	worker.setProgress(1.0);
	PENDING = false;
}

function buildSampleMap(sampleMapName)
{
	// XML Constants
	var header = '<?xml version="1.0" encoding="UTF-8"?>';	
	var sampleMapID = '<samplemap ID="' + sampleMapName + '">';
	var footer = '</samplemap>';
	
	// Sample Properties
	var prefix;
	var name;
	var lowKey;
	var highKey;
	var lowVel = 1;
	var highVel = 127;	
	var rrGroup;
	var rootNote;
	var hz;
	var pitch;
	var sampleStart = 0;
	var loopStart;
	var loopEnd;
	var loopFade;	
	
	var jsonData = {
		"header" : header,
		"sampleMapID" : sampleMapID,
		"footer" : footer,
	};
	
	
	
	var samples = FileSystem.findFiles(WAVETABLES, "*.wav", false);
	
	for (sample in samples)
	{
		// Format: rootHz_rootKeyNum_RRGroup_articulation.wav
		// ideal format: hz{}_root{}_rr{}_vl{}_vh{}_petName.wav
			
		// Grab File Name
		prefix = "{PROJECT_FOLDER}wavetables/";
		name = sample.toString(3);
		
		// Parse RootNote as Int
		rootNote = name.substring(name.indexOf("_") + 1, name.indexOf("_") + 3);
		rootNote = Math.round(rootNote);
		
		
		// Calculate KeySpan
		if (rootNote == 12)
		{
			lowKey = rootNote;
			highKey = rootNote + 3;
		}
		if (rootNote == 88)
		{
			lowKey = rootNote - 3;
			highKey = rootNote;					
		}
		else
		{
			lowKey = rootNote - 2;
			highKey = rootNote + 3;	
		}
		
		// Calculate Single Cycle
		hz = Engine.getFrequencyForMidiNoteNumber(rootNote);		
		var cycle = Math.round(SAMPLERATE / hz);
		
		// Setup Loop
		// Pick any arbitrary Sample
		loopStart = 2000;
		loopEnd = loopStart + cycle;
		loopFade = Math.round(cycle / 2); // TWEAK ME
		
		rrGroup = name.substring(name.lastIndexOf("_") - 2, name.lastIndexOf("_"));
		rrGroup = Math.round(rrGroup);
		print(["RRGroup : " + rrGroup]);
		
		print(["Loopstart: " + loopStart, "LoopEnd: " + loopEnd, "LoopFade: " + loopFade]);
		
		// Start Writing XML
		
		

	/* example sample string
	
	TRIMMED VERSION
	<sample Root="95" LoKey="95" HiKey="95" LoVel="0" HiVel="127" RRGroup="1"
			          FileName="{EXP::Aetheric}B5_AngelicA.wav" LoopEnabled="1"
			          LoopStart="84955" LoopEnd="583132" LoopXFade="43330"/>
		
		<sample Root="95" LoKey="95" HiKey="95" LoVel="0" HiVel="127" RRGroup="1"
		          FileName="{EXP::Aetheric}B5_AngelicA.wav" Duplicate="0" LoopEnabled="1"
		          LoopStart="84955" LoopEnd="583132" LoopXFade="43330" SampleStartMod="705600"
		          SampleEnd="705600" MonolithOffset="0" MonolithLength="708608"
		          SampleRate="44100.0"/>
		
		*/
	}
	
}

// Press the big red button
inline function onButton1Control(component, value)
{
	if (value)
	{
	
		buildSampleMap("wavetable");

		// KEEP THIS

		/*

		local audioFiles = FileSystem.findFiles(ROOT, "*.wav", false);
		
		for (i=0; i<audioFiles.length; i++)
		{
			for (j=0; j<keyRange.length; j++)
			{
				Console.clear();

				local hz = Engine.getFrequencyForMidiNoteNumber(keyRange[j]);
				extractWavetable(audioFiles[i], hz, keyRange[j], i, 1, 127); // (file, f0, rootKey, rrGroup, velLow, velHigh)
				
				Console.print("Audio File: " + (i+1) + "/" + audioFiles.length);
				Console.print("Wavetable: " + (j+1) + "/" + keyRange.length);
			}			
		}
	
		
	Console.clear();
	Console.print("Finished extracting Wavetables.");
	*/
	
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
 