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

inline function sculptHammer(obj)
{
	// Applies a variety of partial gain adjustments to shift a standard sustain closer to a hammer on/pull off
	// Hammers have a modified residue attack, and dampening that starts around the 4th harmonic
	
	// apply dampen
	local idx = obj.frequency / obj.rootFrequency;
	local min = 20.0;
	local max = 20000.0;	
	local crossover = TARGET * 4; // start at 4th order harmonic

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
		local distanceCoefficient = 0.005;
		local spectralDistance = obj.frequency - crossover;
		local attenuation = Math.exp(-spectralDistance * distanceCoefficient);
		obj.gain *= attenuation;		
	}

	// Kills any potential aliasing frequencies as a result of the pitch shift
	if (obj.frequency >= max)
		obj.gain = 0.0;

	// Apply Uniform Gain Boost
	obj.gain *= 2;
}

inline function dampenUpperRegister(obj)
{
	// Dampens harsh frequencies created by resynthesizing a low fundamental
	local idx = obj.frequency / obj.rootFrequency;
	local min = 20.0;
	local max = 20000.0;	
	local pad = 0.0;
	local rootMax = 1400.0;
	local stringCutoff = 165.0;
	local crossover = TARGET + pad;
	local normalizedF0 = (TARGET - min) / (rootMax - min);
		
	if (obj.frequency > crossover && obj.frequency < max && TARGET > stringCutoff)
	{
		local globalCoefficient = 1.0;
		local distanceCoefficient = 0.0025;		
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
			lorisManager.processCustom(file, dampenUpperRegister); // try 			
			break;
		case "naturalHarmonic":
			lorisManager.processCustom(file, sculptNaturalHarmonic);			
			break;
		case "pinchHarmonic":
			lorisManager.processCustom(file, sculptPinchHarmonic);
			break;
		case "hammer":
			lorisManager.processCustom(file, sculptHammer);
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
function extractAllWavetables(file, targetPitch, targetNoteNumber, rrGroup, right)
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
	var outputRS = right ? SAMPLES_RESIDUE_RIGHT : SAMPLES_RESIDUE_LEFT;
	var outputWG = right ? SAMPLES_WAVEGUIDE_RIGHT : SAMPLES_WAVEGUIDE_LEFT;
	var outputFX = right ? SAMPLES_FX_RIGHT : SAMPLES_FX_LEFT;

	// Analyze Audio Buffer
	f0 = buffer.detectPitch(SAMPLERATE, buffer.length * PITCH_START, buffer.length * PITCH_END);

	if (EXTRACT_RESIDUE)
	{
		wt = extractWavetable(file, f0, targetPitch, "residue");
		residue = buffer - wt;

		// Naming convention workaround
		if ((rrGroup + 1) < 10)
			fileName = "residue_" + "rr0" + (rrGroup + 1) + ".wav";
		else
			fileName = "residue_" + "rr" + (rrGroup + 1) + ".wav";	
				
		// Save extracted residue to residue folder
		//saveAudio(SAMPLES_RESIDUE.getChildFile(fileName), residue);
		saveAudio(outputRS.getChildFile(fileName), residue);
		Console.print("Wrote Residue to file");
	}

	// Set our new target before repitching
	TARGET = targetPitch;

	// Now extract the wavetables
	if (EXTRACT_PALMMUTE)
	{
		wt = extractWavetable(file, f0, targetPitch, "palmMute");				
		fileName = "hz" + Math.round(targetPitch) + "_root" + targetNoteNumber + "_rr" + Math.round(rrGroup + 1) + "_vl" + 1 + "_vh" + 64 + file.toString(2);
		saveAudio(outputWG.getChildFile(fileName), wt);
		Console.print("Wrote Palm Mute to file");			
	}
	if (EXTRACT_SUSTAIN)
	{
		wt = extractWavetable(file, f0, targetPitch, "sustain");
	
		fileName = "hz" + Math.round(targetPitch) + "_root" + targetNoteNumber + "_rr" + Math.round(rrGroup + 1) + "_vl" + 65 + "_vh" + 124 + file.toString(2);
		saveAudio(outputWG.getChildFile(fileName), wt);			
		Console.print("Wrote Sustain to file" + outputWG + fileName);	
	}	
	if (EXTRACT_HAMMER)
	{
		wt = extractWavetable(file, f0, targetPitch, "hammer");
		fileName = "hz" + Math.round(targetPitch) + "_root" + targetNoteNumber + "_rr" + Math.round(rrGroup + 1) + "_vl" + 125 + "_vh" + 125 + file.toString(2);
		saveAudio(outputWG.getChildFile(fileName), wt);
		Console.print("Wrote Hammer to file");	
	}
	if (EXTRACT_NATURALHARMONIC)
	{
		wt = extractWavetable(file, f0, targetPitch, "naturalHarmonic");
		fileName = "hz" + Math.round(targetPitch) + "_root" + targetNoteNumber + "_rr" + Math.round(rrGroup + 1) + "_vl" + 126 + "_vh" + 126 + file.toString(2);
		saveAudio(outputWG.getChildFile(fileName), wt);
		Console.print("Wrote Palm Mute to file");			
	}
	if (EXTRACT_PINCHHARMONIC)
	{
		wt = extractWavetable(file, f0, targetPitch, "pinchHarmonic");
		fileName = "hz" + Math.round(targetPitch) + "_root" + targetNoteNumber + "_rr" + Math.round(rrGroup + 1) + "_vl" + 127 + "_vh" + 127 + file.toString(2);
		saveAudio(outputWG.getChildFile(fileName), wt);
		Console.print("Wrote Palm Mute to file");			
	}	
	
	// Finish worker process
	worker.setProgress(1.0);
	PENDING = false;			
}

