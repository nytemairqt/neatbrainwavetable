const test = [];

inline function getSampleParameter(sample, parameter)
{	
	local name = sample.get(Sampler.FileName);
	local offset = parameter.length;
	local start = name.indexOf(parameter) + offset;
	local substring = name.substring(start, name.length);
	local end = parameter == "vh" ? substring.indexOf(".") : substring.indexOf("_");
	substring = substring.substring(0, end);
	local value = Math.round(substring);
	return(value);
}

inline function createXMLSampleMapHeader(name)
{
	local json = {
		"CrossfadeGamma" : 1.0,
		"ID" : name,
		"RRGroupAmount" : NUM_ROUNDROBINS,
		"MicPositions" : ";"
	};

	return json;
}

inline function createJSONSample(root, loKey, hiKey, loVel, hiVel, rrGroup, fileName, loopEnabled, loopStart, loopEnd, loopXFade)
{
	local json = {
		"Root" : root,
		"LoKey" : loKey,
		"HiKey" : hiKey,
		"LoVel" : loVel, 
		"HiVel" : hiVel,
		"RRGroup" : rrGroup, 
		"FileName" : fileName,
		"LoopEnabled" : loopEnabled,
		"LoopStart" : loopStart,
		"LoopEnd" : loopEnd,
		"LoopXFade" : loopXFade
	};

	return json;
}

function buildSampleMap(articulation)
{
	if (!BUILDSAMPLEMAP)
		return;
		
	Console.clear();
	Console.print("Building sampleMap: " + articulation);

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
	var sT; // the stringified version of our sample name
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
			// Not using getSampleParameter function because of naming convention
			idx = name.indexOf("rr") + 2;
			subString = name.substring(idx, idx+2);
			rrGroup = Math.round(subString);

			// Populate sampleMap
			var importedSamples = Sampler1.asSampler().importSamples([path], false);		
						
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
			prefix = "{PROJECT_FOLDER}" + samplesFolder.toString(1) + "/";	
			name = samples[i].toString(3);
			path = prefix + name;

			var jsonHeader = createXMLSampleMapHeader("sampleMapSustain");
			var jsonSampleTest;
			var arrayTest = [];
			arrayTest.push(jsonHeader);

			for (j=0; j<3; j++)
			{
				jsonSampleTest = createJSONSample(24, 32, 64, 40, 110, j, "{PROJECT_FOLDER}residue/residue_rr01.wav", 1, 33101, 38000, 20);
				arrayTest.push(jsonSampleTest);
			}

			var fileTest = FileSystem.getFolder(FileSystem.Samples).getChildFile("sampleMapSustain.xml");

			fileTest.writeAsXmlFile(arrayTest, "sample");

			

			// Import Samples			
			//var importedSamples = Sampler1.asSampler().importSamples([path], true);
			
			/*

			// Set Sample Parameters
			for (s in importedSamples)
			{	
				rootNote = getSampleParameter(s, "root");
				lowVel = getSampleParameter(s, "vl");
				highVel = getSampleParameter(s, "vh");
				rrGroup = getSampleParameter(s, "rr");

				// Calculate keyspan 				
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
				
				
				// Fix for lowKey not working
				for (x = 3; x < 5; x++)
				{
					s.set(x, lowKey);
				}											
				s.set(Sampler.Root, rootNote);	
				s.set(Sampler.HiKey, highKey);
				s.set(Sampler.LoVel, lowVel);
				s.set(Sampler.HiVel, highVel);
				s.set(Sampler.LoopEnabled, 1);				
				s.set(Sampler.RRGroup, rrGroup);

				// Loop

				var hz = getSampleParameter(s, "hz");
				var cycleLength = SAMPLERATE / hz;
				//s.set(Sampler.LoopStart, (Sampler.SampleEnd * .7));
				s.set(Sampler.LoopStart, (s.get(Sampler.SampleEnd) * .7));
				s.set(Sampler.LoopEnd, (s.get(Sampler.LoopStart) + cycleLength));				
				s.set(Sampler.LoopXFade, FADE_TIME);
				

				
				/*
				// still needs: loop start, loop end, loop fade
				s.set(Sampler.LoopStart, (Sampler.SampleEnd * .7));
				*/
				
				
			}
		}				
		// Save sampleMap
		Sampler1.asSampler().saveCurrentSampleMap(sampleMapName);						
	}	
}

