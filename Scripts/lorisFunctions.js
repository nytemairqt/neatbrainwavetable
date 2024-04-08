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
function extractWavetable(file, targetPitch, targetNoteNumber, rrGroup, vl, vh, wgSamples, rsSamples)
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
	var residue;
	var fileName;
	var path;

	// Analyze
	f0 = buffer.detectPitch(SAMPLERATE, buffer.length * PITCH_START, buffer.length * PITCH_END);
	lorisManager.analyse(file, f0);	
	
	// Grab Residue (Call before repitching)
	if (EXTRACTRESIDUES)
	{
		wt = lorisManager.synthesise(file);
		wt = wt[0];
		residue = buffer - wt;
		
		if ((rrGroup + 1) < 10)
			fileName = "0" + (rrGroup + 1) + ".wav";
		else
			fileName = (rrGroup + 1) + ".wav";	
				
		path = rsSamples.getChildFile(fileName);
		
		saveAudio(path, residue)	;
		Console.print("Wrote Residue");
		
		if (!EXTRACTWAVETABLES)
		{
			// End Worker
			worker.setProgress(1.0);
			PENDING = false;
		}
	}
	
	if (EXTRACTWAVETABLES)
	{
		// Repitch
		TARGET = targetPitch;
		lorisManager.processCustom(file, repitch);	
		
		// Resynthesize
		wt = lorisManager.synthesise(file);	
		wt = wt[0]; // Get the Buffer
		
		// Trim Buffer Start & Ends
		for (i=(wt.length * TRIM_START); i<(wt.length * TRIM_END); i++) // KEEP ME
		{
			output.push(wt[i]);
		}
				
		// Write to Audio File	
		fileName = "hz" + Math.round(targetPitch) + "_root" + targetNoteNumber + "_rr" + Math.round(rrGroup + 1) + "_vl" + vl + "_vh" + vh + "_" + file.toString(3);
		path = wgSamples.getChildFile(fileName);
		
		saveAudio(path, output);	
		Console.print("Wrote to file");
		
		// End Worker
		worker.setProgress(1.0);
		PENDING = false;
	}			
}



function buildSampleMap(wgSamples)
{
	if (!BUILDSAMPLEMAP)
		return;
			
	Console.print("Creating sampleMap");

	/* NOTE	rrGroups & sampleMap Loading must be done manually (yuck) */
	
	// Sample Properties
	var prefix;
	var name;
	var path;
	var lowKey;
	var highKey;
	var lowVel = 1;
	var highVel = 127;	
	var rrGroup;
	var rootNote;
	var idx;
	var subString;
	var hz;
	var pitch;
	var sampleStart = 0;
	var loopStart;
	var loopEnd;
	var loopFade;		
	
	// Load and setup SampleMap
	var samples = FileSystem.findFiles(wgSamples, "*.wav", false);
	var sampleMapToLoad = SAMPLEMAPS.getChildFile(sampleMapName + ".xml");
	
	//for (sample in samples)
	for (i=0; i<samples.length; i++)
	{			
		// Grab File Name
		prefix = "{PROJECT_FOLDER}" + wgSamples.toString(1) + "/";
		
		name = samples[i].toString(3);
		path = prefix + name;		
		var buffer = samples[i].loadAsAudioFile();
		
		// Parse RootNote as Int
		idx = name.indexOf("root") + 4;
		
		rootNote = name.substring(name.indexOf("_") + 1, name.indexOf("_") + 3);		
		rootNote = name.substring(idx, idx+2);
		rootNote = Math.round(rootNote);			
				
		// Calculate KeySpan
		if (rootNote == 12)
		{
			lowKey = rootNote;
			highKey = rootNote + 2;
		}
		if (rootNote == 88)
		{
			lowKey = rootNote - 3;
			highKey = rootNote;					
		}
		else
		{
			lowKey = rootNote - 2;
			highKey = rootNote + 2;	
		}
		
		// Calculate Single Cycle
		hz = Engine.getFrequencyForMidiNoteNumber(rootNote);		
		var cycle = Math.round(SAMPLERATE / hz);
		
		// Setup Loop
		// Pick any arbitrary Sample
		loopStart = buffer.length * LOOP_START;
		loopEnd = loopStart + cycle;
		loopFade = FADE_TIME; // if we have a perfect Cycle we don't need any fading 
		
		// Parse RR Group
		idx = name.indexOf("rr") + 2;
		subString = name.substring(idx, idx+10); // pad for RR Groups > 10
		rrGroup = subString.substring(0, subString.indexOf("_"));
		rrGroup = Math.round(rrGroup);			
		
		// Populate sampleMap
		var importedSample = Sampler1.asSampler().importSamples([path], true);
		
		for (s in importedSample)
		{
			// LOW (IDK Why this needs to loop but it does)
			for (x = 3; x < 5; x++)
			{
				s.set(x, lowKey);
			}
					
			s.set(2, rootNote); // ROOT
			s.set(3, highKey); // HIGH
			s.set(5, lowVel); // VLOW
			s.set(6, highVel); // VHIGH									
			s.set(15, loopStart); // loopStart
			s.set(16, loopEnd); // loopEnd
			s.set(17, loopFade); // loopFade
			s.set(18, 1); // loop Active
			
			s.set(7, rrGroup); // RR GROUP
			// 16-19: loopStart, loopEnd, loopFade, loopActive
		}
	}	
}