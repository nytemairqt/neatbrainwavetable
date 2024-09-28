// Instantiate Loris engine
const lorisManager = Engine.getLorisManager();
const worker = Engine.createBackgroundTask("Loris Processor");
lorisManager.set("timedomain", "seconds");
lorisManager.set("enablecache", "false");
worker.setTimeOut(10000);
worker.setForwardStatusToLoadingThread(true);

inline function adjustHarmonicGain(partial, freq, target, tolerance, multiplier)
{
	// Adjusts the gains of any partials that lie within the tolerance of a target frequency	
	local spectralDistance = freq > target ? freq - target : target - freq;
	if (spectralDistance < tolerance)
		partial.gain *= multiplier;
}	


inline function repitch(obj)
{
	// Repitches the audio buffer, allows for optional manual tuning
	local ratio = USEMANUALTUNING ? TARGET / MANUAL_TUNING : TARGET / obj.rootFrequency;
	obj.frequency *= ratio;		
}

inline function trimBuffer(buffer, trimStart, trimEnd)
{
	local output = [];
	for (i=(buffer.length * trimStart); i<(buffer.length * trimEnd); i++)
	{
		output.push(buffer[i]);
	}
	return output;
}

inline function sculptNaturalHarmonic(obj)
{
	// Applies a variety of partial gain adjustments to shift a standard sustain closer to a natural harmonic
	// Harmonics have a boosted fundamental and high frequency dampening
	
	// boost fundamental
	adjustHarmonicGain(obj, obj.frequency, TARGET, 50.0, 4.0);

	// dampen overtones
	local idx = obj.frequency / obj.rootFrequency;
	local min = 20.0;
	local max = 20000.0;	
	local crossover = TARGET * 2; // starting at second harmonic

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
		obj.gain = 0.0;
}

inline function sculptPinchHarmonic(obj)
{
	// Applies a variety of partial gain adjustments to shift a standard sustain closer to a pinch harmonic
	// Pinch harmonics have the fundamental shifted to 2nd, includes 3rd & 4th harmonics, then dampens the rest
	
	// modify key partials:
	adjustHarmonicGain(obj, obj.frequency, TARGET, 50.0, 0.0); // kill fundamental
	adjustHarmonicGain(obj, obj.frequency, (TARGET * 2), 50.0, 2.5); // new fundamental
	adjustHarmonicGain(obj, obj.frequency, (TARGET * 3), 50.0, 0.0); // kill 3rd
	adjustHarmonicGain(obj, obj.frequency, (TARGET * 4), 50.0, 2.0); // boost 4th
	adjustHarmonicGain(obj, obj.frequency, (TARGET * 5), 50.0, 0.0); // kill 5th
	
	// now dampen
	local idx = obj.frequency / obj.rootFrequency;
	local min = 20.0;
	local max = 20000.0;	
	local crossover = TARGET * 3.2; // start at 4th order harmonic

	if (obj.frequency > crossover && obj.frequency < max)
	{
		local globalCoefficient = 1.0;
		local distanceCoefficient = 0.0045; // tweak me
		local spectralDistance = obj.frequency - crossover;
		local attenuation = Math.exp(-spectralDistance * distanceCoefficient);
		obj.gain *= attenuation;		
	}

	// Kills any potential aliasing frequencies as a result of the pitch shift
	if (obj.frequency >= max)
		obj.gain = 0.0;
}

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
		obj.gain = 0.0;
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
		obj.gain = 0.0;
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

inline function extractWavetable(file, f0, targetPitch, articulation)
{
	// Analyze Audio Buffer
	lorisManager.analyse(file, f0);

	// Repitch
	if (articulation != "residue")	
		lorisManager.processCustom(file, repitch);	

	switch(articulation)
	{
		case "sustain":
			lorisManager.processCustom(file, dampenUpperRegister);		
			break;
		case "palmMute":
			lorisManager.processCustom(file, sculptPalmMute);
			break;
		case "naturalHarmonic":
			lorisManager.processCustom(file, sculptNaturalHarmonic);			
			break;
		case "pinchHarmonic":
			lorisManager.processCustom(file, sculptPinchHarmonic);
			break;
		default:
	}	
	wt = lorisManager.synthesise(file);
	wt = wt[0]; // grab the buffer

	if (articulation != "residue") // i find it strange the residue isn't being trimmed, but w/e
		wt = trimBuffer(wt, TRIM_START, TRIM_END); // trim

	return wt;
}


// Extract & Resynthesize
function extractAllWavetables(file, targetPitch, targetNoteNumber, rrGroup, vl, vh)
{
	// Extracts the Residue and all Waveguides from an audio buffer

	// Initialize Variables
	PENDING = true;	
	if (worker.shouldAbort())
		abort();
	worker.setStatusMessage("Analyzing");
	worker.setProgress(0.05);	

	var wt;
	var buffer = file.loadAsAudioFile();
	var f0;		
	var residue;
	var fileName;
	var path;

	// Analyze Audio Buffer
	f0 = buffer.detectPitch(SAMPLERATE, buffer.length * PITCH_START, buffer.length * PITCH_END);

	if (EXTRACT_RESIDUE)
	{
		wt = extractWavetable(file, f0, targetPitch, "residue");
		residue = buffer - wt;

		// Naming convention workaround
		if ((rrGroup + 1) < 10)
			fileName = "0" + (rrGroup + 1) + ".wav";
		else
			fileName = (rrGroup + 1) + ".wav";	
				
		// Save extracted residue to residue folder
		saveAudio(SAMPLES_RESIDUE.getChildFile(fileName), residue);
		Console.print("Wrote Residue to file");
	}

	// changes the global reg "TARGET" to our new targetPitch (used in other funcs)
	TARGET = targetPitch;

	// now we're ready to repitch and modify the partials:

	if (EXTRACT_SUSTAIN)
	{
		wt = extractWavetable(file, f0, targetPitch, "sustain");
	
		fileName = "hz" + Math.round(targetPitch) + "_root" + targetNoteNumber + "_rr" + Math.round(rrGroup + 1) + "_vl" + vl + "_vh" + vh + "_" + file.toString(3);
		saveAudio(SAMPLES_SUSTAIN.getChildFile(fileName), wt);	
		Console.print("Wrote Sustain to file");	
	}

	if (EXTRACT_PALMMUTE)
	{
		wt = extractWavetable(file, f0, targetPitch, "palmMute");				
		fileName = "hz" + Math.round(targetPitch) + "_root" + targetNoteNumber + "_rr" + Math.round(rrGroup + 1) + "_vl" + vl + "_vh" + vh + "_" + file.toString(3);
		saveAudio(SAMPLES_PALMMUTE.getChildFile(fileName), wt);
		Console.print("Wrote Palm Mute to file");			
	}
	if (EXTRACT_NATURALHARMONIC)
	{
		wt = extractWavetable(file, f0, targetPitch, "naturalHarmonic");
		fileName = "hz" + Math.round(targetPitch) + "_root" + targetNoteNumber + "_rr" + Math.round(rrGroup + 1) + "_vl" + vl + "_vh" + vh + "_" + file.toString(3);
		saveAudio(SAMPLES_NATURALHARMONIC.getChildFile(fileName), wt);
		Console.print("Wrote Palm Mute to file");			
	}
	if (EXTRACT_PINCHHARMONIC)
	{
		wt = extractWavetable(file, f0, targetPitch, "pinchHarmonic");
		fileName = "hz" + Math.round(targetPitch) + "_root" + targetNoteNumber + "_rr" + Math.round(rrGroup + 1) + "_vl" + vl + "_vh" + vh + "_" + file.toString(3);
		saveAudio(SAMPLES_PINCHHARMONIC.getChildFile(fileName), wt);
		Console.print("Wrote Palm Mute to file");			
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