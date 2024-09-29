import os 
import json
import xml.etree.ElementTree as ET
import xml.dom.minidom as minidom
import soundfile as sf 

samples = "../Samples/waveguide/"
sampleMaps = "../SampleMaps/"

NUM_ROUNDROBINS = 15
SAMPLERATE = 44100
FILENAME = 'tree'

# audio, samplerate = sf.read(input_audio[seed])


def createXMLSampleMapHeader(name):
	json = {
		"CrossfadeGamma" : 1.0,
		"ID" : name,
		"RRGroupAmount" : NUM_ROUNDROBINS,
		"MicPositions" : ";"
	}
	header = ET.Element('samplemap')
	for key, value in json.items():
		header.set(key, str(value))
	return header 

def parseWaveguide(name):
	# Parses waveguide file name and creates a JSON object for transferring to XML

	# root
	start = name.find("root") + 4
	substring = name[start:]
	substring = substring[0:substring.find("_")]
	root = int(substring[:])

	# rrGroup
	start = name.find("rr") + 2
	substring = name[start:]
	substring = substring[0:substring.find("_")]
	rrGroup = substring[:]

	# loVel
	start = name.find("vl") + 2
	substring = name[start:]
	substring = substring[0:substring.find("_")]
	loVel = substring[:]

	# hiVel
	start = name.find("vh") + 2
	substring = name[start:]
	substring = substring[0:substring.find(".")] # not _ 
	hiVel = substring[:]

	# loKey & hiKey
	if root == 12:
		loKey = root 
		hiKey = root + 2
	elif root == 88:
		loKey = root - 3
		hiKey = root 
	else:
		loKey = root - 2
		hiKey = root + 2

	# Loop
	loopEnabled = 1 
	loopXFade = 15

	# Cycle Length Calculation
	start = name.find("hz") + 2
	substring = name[start:]
	substring = substring[0:substring.find("_")]
	hz = int(substring[:])
	cycle = int(SAMPLERATE / hz) 

	loopStart = int(60000 * .6)
	loopEnd = int(loopStart + cycle )

	#fullPath = "../Samples/waveguide/" + name
	#audio, samplerate = sf.read(fullPath) # only use for testing

	# FileName
	fileName = r"{PROJECT_FOLDER}waveguide/" + name # can i do that?
	return root, loKey, hiKey, loVel, hiVel, rrGroup, fileName, loopEnabled, loopStart, loopEnd, loopXFade


def createJSONFromParse(root, loKey, hiKey, loVel, hiVel, rrGroup, fileName, loopEnabled, loopStart, loopEnd, loopXFade):
	json = {
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
	}
	return json

if __name__ == "__main__":
	header = createXMLSampleMapHeader(FILENAME)
	tree = ET.ElementTree(header)

	for root, dirs, files in os.walk(samples):
		for name in files:
			root, loKey, hiKey, loVel, hiVel, rrGroup, fileName, loopEnabled, loopStart, loopEnd, loopXFade = parseWaveguide(name)
			json = createJSONFromParse(root, loKey, hiKey, loVel, hiVel, rrGroup, fileName, loopEnabled, loopStart, loopEnd, loopXFade)
			sample = ET.SubElement(header, "sample")
			for key, value in json.items():
				sample.set(key, str(value))
			

	#firstSample = ET.SubElement(header, "sample")
	#secondSample = ET.SubElement(header, "sample")
	#for key, value in test.items():
	#	firstSample.set(key, str(value))
	#for key, value in test2.items():
	#	secondSample.set(key, str(value))

	# "Prettify" 
	rough_string = ET.tostring(header, 'utf-8')
	parsed_string = minidom.parseString(rough_string)
	pretty_xml = parsed_string.toprettyxml(indent="  ")

	# Write Out
	with open(FILENAME + '.xml', "w") as file:
		file.write(pretty_xml)

	print("saved")