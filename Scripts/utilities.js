inline function checkRRGroup(fileName)
{
	// Parses the fileName and returns the round-robin group for residue recombination

	local rrStringIndex = fileName.indexOf("rr");
	local rrGroup = fileName.substring(rrStringIndex, fileName.length);
	rrStringIndex = rrGroup.indexOf("_");
	rrGroup = rrGroup.substring(0, rrStringIndex);	

	switch (rrGroup)
	{
		case "rr1":
			rrGroup = "rr01";
			break;
		case "rr2":
			rrGroup = "rr02";
			break;
		case "rr3":
			rrGroup = "rr03";
			break;
		case "rr4":
			rrGroup = "rr04";
			break;
		case "rr5":
			rrGroup = "rr05";
			break;	
		case "rr6":
			rrGroup = "rr06";
			break;
		case "rr7":
			rrGroup = "rr07";
			break;	
		case "rr8":
			rrGroup = "rr08";
			break;		
		case "rr9":
			rrGroup = "rr09";
			break;				
		default:
			break;												
	}
	return rrGroup;
}

function recombineResidue()
{
	

	Engine.extendTimeOut(120000);

	var waveguideFiles = FileSystem.findFiles(SAMPLES_WAVEGUIDE_LEFT, "*.wav", false);
	var residueFiles = FileSystem.findFiles(SAMPLES_RESIDUE_LEFT, "*.wav", false);
	var waveguideBuffer;
	var residueBuffer;
	var rrGroup;
	var fileName;
	
	worker.setProgress(0.05);

	for (i=0; i<waveguideFiles.length; i++) // for each waveguide
	{
		Console.clear();

		waveguideBuffer = waveguideFiles[i].loadAsAudioFile();
	
		// Parse Waveguide File to extract Residue RR Group
		fileName = waveguideFiles[i].toString(3);		
		rrGroup = checkRRGroup(fileName);
		
		// Now load residue and recombine
		residueBuffer = SAMPLES_RESIDUE_LEFT.getChildFile("residue_" + rrGroup + ".wav").loadAsAudioFile();			

		for (j=0; j<waveguideBuffer.length; j++)
		{
			waveguideBuffer[j] = waveguideBuffer[j] + residueBuffer[j];
		}
		saveAudio(SAMPLES_OUTPUT_LEFT.getChildFile(fileName), waveguideBuffer);					
		Console.print("Wrote: " + (i+1) + "/" + waveguideFiles.length);
	}		
	
	worker.setProgress(0.5);
	
	if (STEREO_INSTRUMENT)
	{
		// Right Side
		waveguideFiles = FileSystem.findFiles(SAMPLES_WAVEGUIDE_RIGHT, "*.wav", false);
		residueFiles = FileSystem.findFiles(SAMPLES_RESIDUE_RIGHT, "*.wav", false);

		for (i=0; i<waveguideFiles.length; i++) // for each waveguide
		{				
			Console.clear();

			waveguideBuffer = waveguideFiles[i].loadAsAudioFile();
		
			// Parse Waveguide File to extract Residue RR Group
			fileName = waveguideFiles[i].toString(3);		
			rrGroup = checkRRGroup(fileName);
			
			// Now load residue and recombine
			residueBuffer = SAMPLES_RESIDUE_RIGHT.getChildFile("residue_" + rrGroup + ".wav").loadAsAudioFile();			

			for (j=0; j<waveguideBuffer.length; j++)
			{
				waveguideBuffer[j] = waveguideBuffer[j] + residueBuffer[j];
			}

			saveAudio(SAMPLES_OUTPUT_RIGHT.getChildFile(fileName), waveguideBuffer);					
			Console.print("Wrote: " + (i+1) + "/" + waveguideFiles.length);
		}	
	}
	
	worker.setProgress(1.0);
}