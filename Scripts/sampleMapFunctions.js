function buildSampleMap(articulation)
{
	// where articulation is string name of folder [residue, sustain, palmMute, naturalHarmonic, pinchHarmonic]
	// do fx shit later probably

	if (!BUILDSAMPLEMAP)
		return;

	var samples;
	var samplesFolder;
	var sampleMapName;
	
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

	switch (articulation)
	{
		case "residue":
			samplesFolder = SAMPLES_RESIDUE;
			sampleMapName = "sampleMapResidue";
			break;
		case "sustain":
			samplesFolder = SAMPLES_SUSTAIN;
			sampleMapName = "sampleMapSustain";
			break;
		case "palmMute":
			samplesFolder = SAMPLES_PALMMUTE;
			sampleMapName = "sampleMapSustain";
			break;
		case "naturalHarmonic":
			samplesFolder = SAMPLES_NATURALHARMONIC;
			sampleMapName = "sampleMapSustain";
			break;
		case "pinchHarmonic":
			samplesFolder = SAMPLES_PINCHHARMONIC;
			sampleMapName = "sampleMapSustain";
			break;
		case "fx": // ???? maybe add later?
			break;
		default:
			Console.print("Invalid sample folder selected, cancelling...");
			return;
	}

	var samples = FileSystem.findFiles(samplesFolder, "*.wav", false);
	Sampler1.asSampler().clearSampleMap(); // clear first to avoid overlapping samples

	var samplesToImport = [];

	// residue

	if (articulation == "residue")
	{
		lowKey = 12;
		highKey = 88;
		lowVel = 1;
		highVel = 127;

		for (i=0; i<samples.length; i++)
		{
			// Get sample name as string
			prefix = "{PROJECT_FOLDER}" + samplesFolder.toString(1) + "/";	
			name = samples[i].toString(3);
			path = prefix + name;		

			test.push(path);
			
			// Parse RR group from filename
			idx = name.indexOf("rr") + 2;
			subString = name.substring(idx, idx+10); // pad for RR Groups > 10
			rrGroup = subString.substring(0, subString.indexOf("_"));
			rrGroup = Math.round(rrGroup);		

			samplesToImport.push(path);											
		}

		// Populate sampleMap
		var importedSamples = Sampler1.asSampler().importSamples(samplesToImport, false);
		for (s in importedSamples)
		{
			// Assign sample properties
			// This first one needs to loop (for some reason)
			for (x = 3; x < 5; x++)
			{
				s.set(x, lowKey); // LOW KEY
			}					
			s.set(2, lowKey); // ROOT SAME AS LOW KEY FOR RESIDUE
			s.set(3, highKey); // HIGH KEY
			s.set(5, lowVel); // LOW VELOCITY
			s.set(6, highVel); // HIGH VELOCITY							
			s.set(18, 0); // LOOP ACTIVE (Bool)				
			s.set(7, rrGroup); // RR GROUP

			// 16-19: LOOP START, LOOP END, LOOP FADE, LOOP ACTIVE
		}

		// Save sampleMap
		Sampler1.asSampler().saveCurrentSampleMap(sampleMapName);
	}
	else // add fx later
	{
		return;
	}
	
	/*
	for (i=0; i<samples.length; i++)
	{
		// Get sample name as string
		prefix = "{PROJECT_FOLDER}" + samplesFolder.toString(1) + "/";	
		name = samples[i].toString(3);
		path = prefix + name;		

		// Grab index of "root" from filename to find the sample's root
		idx = name.indexOf("root") + 4;	
		rootNote = name.substring(name.indexOf("_") + 1, name.indexOf("_") + 3); // this wont work for residue
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
	*/
}



function old_buildSampleMap(wgSamples)
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

	/*
	
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

	*/
}