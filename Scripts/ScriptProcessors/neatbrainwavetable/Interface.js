Content.makeFrontInterface(600, 600);

// FOLDERS
const AUDIOFILES = FileSystem.getFolder(FileSystem.AudioFiles);
const SAMPLES = FileSystem.getFolder(FileSystem.Samples);
const SAMPLEMAPS = FileSystem.getFolder(FileSystem.Samples).getParentDirectory().getChildFile("sampleMaps");
const Sampler1 = Synth.getChildSynth("Sampler1");

// CREATE DIRECTORIES
const SAMPLES_RESIDUE_LEFT = SAMPLES.createDirectory("rsLeft");
const SAMPLES_RESIDUE_RIGHT = SAMPLES.createDirectory("rsRight");
const SAMPLES_WAVEGUIDE_LEFT = SAMPLES.createDirectory("wgLeft");
const SAMPLES_WAVEGUIDE_RIGHT = SAMPLES.createDirectory("wgRight");
const SAMPLES_FX_LEFT = SAMPLES.createDirectory("fxLeft");
const SAMPLES_FX_RIGHT = SAMPLES.createDirectory("fxRight");
const SAMPLES_OUTPUT_LEFT = SAMPLES.createDirectory("outputLeft");
const SAMPLES_OUTPUT_RIGHT = SAMPLES.createDirectory("outputRight");

// HYPERPAMETERS
const EXTRACT_RESIDUE = true;
const EXTRACT_SUSTAIN = true;
const EXTRACT_PALMMUTE = false;
const EXTRACT_NATURALHARMONIC = false;
const EXTRACT_PINCHHARMONIC = false;
const EXTRACT_HAMMER = false;
const USEMANUALTUNING = true;
const STEREO_INSTRUMENT = false;

const PITCH_START = 0.1;
const PITCH_END = 0.8;
//const TRIM_START = 0.05;
const TRIM_START = 0.00;
const TRIM_END = 0.7;
const LOOP_START = 0.3;
const FADE_TIME = 15;
const SAMPLERATE = 44100.0;
const NUM_ROUNDROBINS = 15;
const keyRange = [12, 17, 22, 27, 32, 37, 42, 47, 52, 57, 62, 67, 72, 77, 82, 88];
reg PENDING = false;
reg TARGET = 440.0;

// TUNINGS
//const MANUAL_TUNING = 55.0; // bass guitar
const MANUAL_TUNING = 82.0; // guitar

// INCLUDES
include("lorisFunctions.js");

// INTERFACE
inline function onbtnExtractWaveguidesControl(component, value)
{
	if (!value)
		return;
	else
	{
		// Left Side (Or Mono)
		local audioFiles = FileSystem.findFiles(AUDIOFILES.getChildFile("left"), "*.wav", false);
		for (i=0; i<audioFiles.length; i++) // For each audio file
		{
			for (j=0; j<keyRange.length; j++) // For each registered key
			{
				Console.clear();
				local targetPitch = Engine.getFrequencyForMidiNoteNumber(keyRange[j]);
				extractAllWavetables(audioFiles[i], targetPitch, keyRange[j], i, false); // left side
				Console.print("Audio File: " + (i+1) + "/" + audioFiles.length);
				Console.print("Wavetable: " + (j+1) + "/" + keyRange.length);
			}		
		}									
		Console.clear();
		Console.print("Finished extracting left waveguides.");

		if (STEREO_INSTRUMENT)
		{
			// Right Side
			local audioFiles = FileSystem.findFiles(AUDIOFILES.getChildFile("right"), "*.wav", false);
			for (i=0; i<audioFiles.length; i++) // For each audio file
			{
				for (j=0; j<keyRange.length; j++) // For each registered key
				{
					Console.clear();
					local targetPitch = Engine.getFrequencyForMidiNoteNumber(keyRange[j]);
					extractAllWavetables(audioFiles[i], targetPitch, keyRange[j], i, true); // left side
					Console.print("Audio File: " + (i+1) + "/" + audioFiles.length);
					Console.print("Wavetable: " + (j+1) + "/" + keyRange.length);
				}		
			}									
			Console.clear();
			Console.print("Finished extracting left waveguides.");
		}
	}
};

Content.getComponent("btnExtractWaveguides").setControlCallback(onbtnExtractWaveguidesControl);



inline function onbtnRecombineResiduesControl(component, value)
{
	if (!value)
		return;
	else
	{

		// Left Side (Or Mono)

		// recombineResidue(waveguidePath, residuePath, rrGroup, right)

		local waveguideFiles = FileSystem.findFiles(SAMPLES_WAVEGUIDE_LEFT, "*.wav", false);
		local residueFiles = FileSystem.findFiles(SAMPLES_RESIDUE_LEFT, "*.wav", false);

		for (i=0; i<waveguideFiles.length; i++) // for each waveguide
		{
			Console.clear();

			local waveguideBuffer = waveguideFiles[i].loadAsAudioFile();
		
			// Parse Waveguide File to extract Residue RR Group
			local fileName = waveguideFiles[i].toString(3);
			
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
			
			// Now load residue and recombine
			local residueBuffer = SAMPLES_RESIDUE_LEFT.getChildFile("residue_" + rrGroup + ".wav").loadAsAudioFile();			

			for (j=0; j<waveguideBuffer.length; j++)
			{
				waveguideBuffer[j] = waveguideBuffer[j] + residueBuffer[j];
			}

			Console.print("Writing: " + fileName);	
			
			saveAudio(SAMPLES_OUTPUT_LEFT.getChildFile(fileName), waveguideBuffer);
			
			
			Console.print("Wrote: " + i + "/" + waveguideFiles.length);

		}		
	}
};

Content.getComponent("btnRecombineResidues").setControlCallback(onbtnRecombineResiduesControl);



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
 