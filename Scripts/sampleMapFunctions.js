const test = [];

function buildSampleMap(articulation)
{
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
	var lowVel;
	var highVel;	
	var rrGroup;
	var rootNote;
	var idx;
	var idxEnd;
	var subString;
	var hz;
	var pitch;
	var sampleStart = 0;
	var loopStart;
	var loopEnd;
	var loopFade;	

	if (articulation == "residue")
	{
		samplesFolder = SAMPLES_RESIDUE;
		sampleMapName = "sampleMapResidue";
	}
	else if (articulation == "fx")
	{
		return;
	}
	else
	{	
		samplesFolder = SAMPLES_WAVEGUIDE;
		sampleMapName = "sampleMapSustain";
	}

	Sampler1.asSampler().clearSampleMap(); // clear first to avoid overlapping samples	

	// residue

	if (articulation == "residue")
	{
		samples = FileSystem.findFiles(samplesFolder, "*.wav", false);

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
			
			// Parse RR group from filename
			idx = name.indexOf("rr") + 2;
			subString = name.substring(idx, idx+2);
			rrGroup = Math.round(subString);	

			// Populate sampleMap
			var importedSamples = Sampler1.asSampler().importSamples([path], false);		
				
			// Set the RR Group Amount
			Sampler1.setAttribute(Sampler1.RRGroupAmount, NUM_ROUNDROBINS);
		
			for (s in importedSamples)
			{				
				// Assign sample properties
				s.set(Sampler.Root, lowKey);
				s.set(Sampler.LoKey, lowKey);
				s.set(Sampler.HiKey, highKey);
				s.set(Sampler.LoVel, lowVel);
				s.set(Sampler.HiVel, highVel);
				s.set(Sampler.LoopEnabled, 0);				
				s.set(Sampler.RRGroup, rrGroup);				
			}			
		}		

		// Save sampleMap
		Sampler1.asSampler().saveCurrentSampleMap(sampleMapName);
	}
	else if (articulation == "fx") // add fx later
	{
		return;
	}
	else 
	{
		samples = FileSystem.findFiles(samplesFolder, "*.wav", false);

		for (i=0; i<samples.length; i++)
		{
			// Get sample name as string
			prefix = "{PROJECT_FOLDER}" + folder.toString(1) + "/";	
			name = samples[i].toString(3);
			path = prefix + name;		

			// Grab index of "root" from filename to find the sample's root
			idx = name.indexOf("root") + 4;	
			rootNote = name.substring(idx, idx+2);
			rootNote = Math.round(rootNote);	

			// Grab Velocities
			idx = name.indexOf("vl");
			idxEnd = name.indexOf(".");
			subString = name.substring(idx, idxEnd);

			// LowVel
			idx = subString.indexOf("vl") + 2;
			idxEnd = subString.indexOf("_");
			lowVel = Math.round(subString.substring(idx, idxEnd));
			
			// HighVel
			idx = subString.indexOf("vh") + 2;
			idxEnd = subString.length;
			highVel = Math.round(subString.substring(idx, idxEnd));			
					
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

			var importedSamples = Sampler1.asSampler().importSamples([path], true);

			// Set the RR Group Amount
			Sampler1.setAttribute(Sampler1.RRGroupAmount, NUM_ROUNDROBINS);
		
			for (s in importedSamples)
			{				
				// Assign sample properties
				s.set(Sampler.Root, lowKey);
				s.set(Sampler.LoKey, lowKey);
				s.set(Sampler.HiKey, highKey);
				s.set(Sampler.LoVel, lowVel);
				s.set(Sampler.HiVel, highVel);
				s.set(Sampler.LoopEnabled, 1);				
				s.set(Sampler.RRGroup, rrGroup);					

				// still needs: loop start, loop end, loop fade
			}		


		}
				

		// Save sampleMap
		Sampler1.asSampler().saveCurrentSampleMap(sampleMapName);						
	}	
}

