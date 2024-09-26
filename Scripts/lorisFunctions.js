// Instantiate Loris engine
const lorisManager = Engine.getLorisManager();
const worker = Engine.createBackgroundTask("Loris Processor");
//lorisManager.set("timedomain", "0to1");
lorisManager.set("timedomain", "seconds");
lorisManager.set("enablecache", "false");
worker.setTimeOut(10000);
worker.setForwardStatusToLoadingThread(true);

inline function repitch(obj)
{
	// Repitches the audio buffer, allows for optional manual tuning
	// Note: don't use Console.print() in Loris functions	
	local ratio = USEMANUALTUNING ? TARGET / MANUAL_TUNING : TARGET / obj.rootFrequency;
	obj.frequency *= ratio;		
}

inline function boostFundamental(obj)
{
	// Boosts frequencies around the fundamental, useful for sculpting tone before dampening
	local spectralDistance = obj.frequency > TARGET ? obj.frequency - TARGET : TARGET - obj.frequency;
	if (spectralDistance < 50.0)
	{
		obj.gain *= 5.0;
	}
}

inline function sculptNaturalHarmonic(obj)
{
	// Applies a variety of partial gain adjustments to shift a standard sustain closer to a natural harmonic
	// Harmonics have a boosted fundamental and high frequency dampening

	// boost fundamental
	local spectralDistance = obj.frequency > TARGET ? obj.frequency - TARGET : TARGET - obj.frequency;
	if (spectralDistance < 50.0)
	{
		obj.gain *= 4.0;
	}

	// dampen overtones
	local idx = obj.frequency / obj.rootFrequency;
	local min = 20.0;
	local max = 20000.0;	
	local crossover = TARGET * 2; // second harmonic

	if (obj.frequency > crossover && obj.frequency < max)
	{
		local globalCoefficient = 1.0;
		local distanceCoefficient = 0.0045; 
		local spectralDistance = obj.frequency - crossover;
		local attenuation = Math.exp(-spectralDistance * distanceCoefficient);
		obj.gain *= attenuation;		
	}

	// Kills any potential aliasing frequencies as a result of the pitch shift
	if (obj.frequency >= max)
	{
		obj.gain = 0.0;
	}
}

inline function sculptPinchharmonic(obj){}

inline function sculptPalmMute(obj)
{
	// Applies a variety of partial gain adjustments to shift a standard sustain closer to a palm mute
	// Palm mutes have dynamic high frequency dampening and no boost to the fundamental
	
	// apply dampen 
	local idx = obj.frequency / obj.rootFrequency;
	local min = 20.0;
	local max = 20000.0;	
	local crossover = TARGET;

	if (obj.frequency > crossover && obj.frequency < max) 
	{
		local globalCoefficient = 1.0;
		local distanceCoefficient = 0.007; // more aggressive dampening
		local spectralDistance = obj.frequency - crossover;
		local attenuation = Math.exp(-spectralDistance * distanceCoefficient);
		obj.gain *= attenuation;		
	}

	// Kills any potential aliasing frequencies as a result of the pitch shift
	if (obj.frequency >= max)
	{
		obj.gain = 0.0;
	}
}

inline function dampenUpperRegister(obj)
{
	// Dampens harsh frequencies created by resynthesizing a low fundamental
	local idx = obj.frequency / obj.rootFrequency;
	local min = 20.0;
	local max = 20000.0;	
	local pad = 100.0;
	local rootMax = 1400.0;
	local stringCutoff = 220.0;
	local crossover = TARGET + pad;
	local normalizedF0 = (TARGET - min) / (rootMax - min);
		
	if (obj.frequency > crossover && obj.frequency < max && TARGET > stringCutoff)
	{
		local globalCoefficient = 1.0;
		local distanceCoefficient = 0.003;		
		local spectralDistance = obj.frequency - crossover;
		local attenuation = Math.exp(-spectralDistance * ((distanceCoefficient * normalizedF0) * globalCoefficient));
		obj.gain *= attenuation;		
	}
	
	// Kills any potential aliasing frequencies as a result of the pitch shift
	if (obj.frequency >= max)
	{
		obj.gain = 0.0;
	}
}

inline function saveAudio(path, buffer)
{
	// Writes the audio buffer to a .wav file
	
	path.writeAudioFile(buffer, SAMPLERATE, 24);
}

inline function abort()
{
	// Aborts active worker process
	
	worker.setProgress(0.0);
	worker.setStatusMessage("Cancel");
	PENDING = false;	
	return;
}


// Extract & Resynthesize
function extractWavetable(file, targetPitch, targetNoteNumber, rrGroup, vl, vh, wgSamples, rsSamples)
{
	// Extracts the Residue and Waveguides from an audio buffer

	// Initialize Variables
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

	// Analyze Audio Buffer
	f0 = buffer.detectPitch(SAMPLERATE, buffer.length * PITCH_START, buffer.length * PITCH_END);
	lorisManager.analyse(file, f0);	
	
	// Extract Residue (Before Repitching)
	if (EXTRACTRESIDUES)
	{
		wt = lorisManager.synthesise(file);
		wt = wt[0];
		residue = buffer - wt; // Phase invert to extract Residue
		
		// Naming convention workaround
		if ((rrGroup + 1) < 10)
			fileName = "0" + (rrGroup + 1) + ".wav";
		else
			fileName = (rrGroup + 1) + ".wav";	
				
		// Save extracted residue to residue folder
		path = rsSamples.getChildFile(fileName);		
		saveAudio(path, residue)	;
		Console.print("Wrote Residue");
	}
			
	if (EXTRACTWAVETABLES)
	{
		// Repitch buffer to target
		TARGET = targetPitch;
		lorisManager.processCustom(file, repitch);	

		// attempting to use applyFilter (currently not working)
		//var filterData = [[0.0, 0], [0.2,  0], [0.4,  20000], [0.4, 10000], [0.6, 0]]; // these might be 0-1 instead of frequency
		//lorisManager.process(file, "applyFilter", filterData); // applies a uniform gain multiplier with no time-modulation
		
		// Dampen upper register harshness
		// only used for sustains
		if (DAMPENUPPERREGISTER)
			lorisManager.processCustom(file, dampenUpperRegister);
		
		// create natural harmonic
		//lorisManager.processCustom(file, sculptNaturalHarmonic);
		
		// create palm mute // requires more dynamic dampening
		//lorisManager.processCustom(file, sculptPalmMute);
		
		// Resynthesize new waveguide
		wt = lorisManager.synthesise(file);	
		wt = wt[0]; // Get the Buffer
		
		// Trim buffer start & end
		for (i=(wt.length * TRIM_START); i<(wt.length * TRIM_END); i++) // KEEP ME
		{
			output.push(wt[i]);
		}
				
		// Write waveguide to audio file
		fileName = "hz" + Math.round(targetPitch) + "_root" + targetNoteNumber + "_rr" + Math.round(rrGroup + 1) + "_vl" + vl + "_vh" + vh + "_" + file.toString(3);
		path = wgSamples.getChildFile(fileName);
		saveAudio(path, output);	
		Console.print("Wrote to file");		
	}

	// Finish worker process
	worker.setProgress(1.0);
	PENDING = false;			
}



function buildSampleMap(wgSamples)
{
	// Loads a sampleMap, imports audio samples and assigns them, then saves the sampleMap
	if (!BUILDSAMPLEMAP)
		return;
			
	Console.print("Creating sampleMap");

	// NOTE	rrGroups & sampleMap Loading must be done manually (yuck)
	
	// Initialize Variables
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
	
	// Find samples & load sampleMap
	var samples = FileSystem.findFiles(wgSamples, "*.wav", false);
	var sampleMapToLoad = SAMPLEMAPS.getChildFile(sampleMapName + ".xml");
	
	// Iterate through samples
	for (i=0; i<samples.length; i++)
	{			
		// Get sample name as string
		prefix = "{PROJECT_FOLDER}" + wgSamples.toString(1) + "/";	
		name = samples[i].toString(3);
		path = prefix + name;		

		// Grab index of "root" from filename to find the sample's root
		idx = name.indexOf("root") + 4;	
		rootNote = name.substring(name.indexOf("_") + 1, name.indexOf("_") + 3);		
		rootNote = name.substring(idx, idx+2);
		rootNote = Math.round(rootNote);					
				
		// Calculate keyspan (where the sample will stretch to/from)
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

		// Load sample into buffer and calculate cycle length
		var buffer = samples[i].loadAsAudioFile();		
		hz = Engine.getFrequencyForMidiNoteNumber(rootNote);		
		var cycle = Math.round(SAMPLERATE / hz);

		// Setup loop points w/ respect to cycle
		loopStart = buffer.length * LOOP_START;
		loopEnd = loopStart + cycle;
		loopFade = FADE_TIME; 
		
		// Parse RR group from filename
		idx = name.indexOf("rr") + 2;
		subString = name.substring(idx, idx+10); // pad for RR Groups > 10
		rrGroup = subString.substring(0, subString.indexOf("_"));
		rrGroup = Math.round(rrGroup);			
		
		// Populate sampleMap
		var importedSample = Sampler1.asSampler().importSamples([path], true);		
		for (s in importedSample)
		{
			// Assign sample properties
			// This first one needs to loop (for some reason)
			for (x = 3; x < 5; x++)
			{
				s.set(x, lowKey); // LOW KEY
			}					
			s.set(2, rootNote); // ROOT KEY
			s.set(3, highKey); // HIGH KEY
			s.set(5, lowVel); // LOW VELOCITY
			s.set(6, highVel); // HIGH VELOCITY							
			s.set(15, loopStart); // LOOP START
			s.set(16, loopEnd); // LOOP END
			s.set(17, loopFade); // LOOP FADE
			s.set(18, 1); // LOOP ACTIVE (Bool)
			
			s.set(7, rrGroup); // RR GROUP

			// 16-19: LOOP START, LOOP END, LOOP FADE, LOOP ACTIVE
		}

		// Save sampleMap
		// Sampler.saveCurrentSampleMap(String relativePathWithoutXML)
	}	
}