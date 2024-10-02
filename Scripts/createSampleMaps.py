import os 
import json
import xml.etree.ElementTree as ET
import xml.dom.minidom as minidom
import soundfile as sf 

wgLeft = "../Samples/wgLeft/"
wgRight = "../Samples/wgRight/"
rsLeft = "../Samples/rsLeft/"
rsRight = "../Samples/rsRight/"
fxLeft = "../Samples/fxLeft/"
fxRight = "../Samples/fxRight/"
sampleMaps = "../SampleMaps/"

xml_wgLeft = "../SampleMaps/wgLeft"
xml_wgRight = "../SampleMaps/wgRight"
xml_rsLeft = "../SampleMaps/rsLeft"
xml_rsRight = "../SampleMaps/rsRight"
xml_fxLeft = "../SampleMaps/fxLeft"
xml_fxRight = "../SampleMaps/fxRight"

BUILD_WAVEGUIDE = True
BUILD_RESIDUE = True
BUILD_FX = False 
STEREO_INSTRUMENT = True 

NUM_ROUNDROBINS = 15
SAMPLERATE = 44100

##

def createXMLSampleMapHeader(name):
	json = {
		"CrossfadeGamma" : 1.0,
		"ID" : name[name.find("SampleMaps/")+11:],
		"RRGroupAmount" : NUM_ROUNDROBINS,
		"MicPositions" : ";"
	}
	header = ET.Element('samplemap')
	for key, value in json.items():
		header.set(key, str(value))
	return header 

def parseWaveguide(name, right=False):
	# Parses waveguide file name and creates a JSON object for transferring to XML

	# fullPath = "../Samples/waveguide/" + name # || TESTING ONLY
	# audio, samplerate = sf.read(fullPath) # || TESTING ONLY 

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

	# Cycle Length Calculation
	start = name.find("hz") + 2
	substring = name[start:]
	substring = substring[0:substring.find("_")]
	hz = int(substring[:])
	cycle = int(SAMPLERATE / hz) 

	# Loop
	loopEnabled = 1
	loopStart = 40000
	loopEnd = loopStart + cycle 
	loopXFade = 15
	sampleStartMod = 0

	# FileName
	if (right):
		fileName = r"{PROJECT_FOLDER}wgRight/" + name
	else:
		fileName = r"{PROJECT_FOLDER}wgLeft/" + name
	
	return root, loKey, hiKey, loVel, hiVel, rrGroup, fileName, loopEnabled, loopStart, loopEnd, loopXFade, sampleStartMod

def parseResidue(name, right=False):
	# Parses residue file name and creates a JSON object for transferring to XML

	# Residue is much simpler:
	root = 12
	loKey = 12
	hiKey = 88
	loVel = 1
	hiVel = 127

	# rrGroup
	start = name.find("rr") + 2
	substring = name[start:]
	substring = substring[0:substring.find(".")] # not _ 
	rrGroup = substring[:]

	# Loop (Arbitrary non-zero values)
	loopEnabled = 0
	loopXFade = 5
	loopStart = 5 
	loopEnd = 20 
	sampleStartMod = 2000

	# FileName
	if (right):
		fileName = r"{PROJECT_FOLDER}rsRight/" + name
	else:
		fileName = r"{PROJECT_FOLDER}rsLeft/" + name
	return root, loKey, hiKey, loVel, hiVel, rrGroup, fileName, loopEnabled, loopStart, loopEnd, loopXFade, sampleStartMod


def createJSONFromParse(root, loKey, hiKey, loVel, hiVel, rrGroup, fileName, loopEnabled, loopStart, loopEnd, loopXFade, sampleStartMod):
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
		"LoopXFade" : loopXFade,
		"SampleStartMod" : sampleStartMod
	}
	return json

if __name__ == "__main__":

	# LEFT SIDE FIRST 

	# Waveguide
	if BUILD_WAVEGUIDE:
		header = createXMLSampleMapHeader(xml_wgLeft)
		tree = ET.ElementTree(header)
		
		for root, dirs, files in os.walk(wgLeft):
			for name in files:
				root, loKey, hiKey, loVel, hiVel, rrGroup, fileName, loopEnabled, loopStart, loopEnd, loopXFade, sampleStartMod = parseWaveguide(name, right=False)
				json = createJSONFromParse(root, loKey, hiKey, loVel, hiVel, rrGroup, fileName, loopEnabled, loopStart, loopEnd, loopXFade, sampleStartMod)
				sample = ET.SubElement(header, "sample")
				for key, value in json.items():
					sample.set(key, str(value))

		# "Prettify" 
		rough_string = ET.tostring(header, 'utf-8')
		parsed_string = minidom.parseString(rough_string)
		pretty_xml = parsed_string.toprettyxml(indent="  ")

		# Write Out
		with open(xml_wgLeft + '.xml', "w") as file:
			file.write(pretty_xml)

		print("Saved Waveguide.")

	# Residue
	if BUILD_RESIDUE:
		header = createXMLSampleMapHeader(xml_rsLeft)
		tree = ET.ElementTree(header)
		
		for root, dirs, files in os.walk(rsLeft):
			for name in files:
				root, loKey, hiKey, loVel, hiVel, rrGroup, fileName, loopEnabled, loopStart, loopEnd, loopXFade, sampleStartMod = parseResidue(name, right=False)
				json = createJSONFromParse(root, loKey, hiKey, loVel, hiVel, rrGroup, fileName, loopEnabled, loopStart, loopEnd, loopXFade, sampleStartMod)
				sample = ET.SubElement(header, "sample")
				for key, value in json.items():
					sample.set(key, str(value))

		# "Prettify" 
		rough_string = ET.tostring(header, 'utf-8')
		parsed_string = minidom.parseString(rough_string)
		pretty_xml = parsed_string.toprettyxml(indent="  ")

		# Write Out
		with open(xml_rsLeft + '.xml', "w") as file:
			file.write(pretty_xml)

		print("Saved Residue Left.")

	############################
	# RIGHT SIDE 

	if STEREO_INSTRUMENT:

		# Waveguide
		if BUILD_WAVEGUIDE:
			header = createXMLSampleMapHeader(xml_wgRight)
			tree = ET.ElementTree(header)
			
			for root, dirs, files in os.walk(wgRight):
				for name in files:
					root, loKey, hiKey, loVel, hiVel, rrGroup, fileName, loopEnabled, loopStart, loopEnd, loopXFade, sampleStartMod = parseWaveguide(name, right=True)
					json = createJSONFromParse(root, loKey, hiKey, loVel, hiVel, rrGroup, fileName, loopEnabled, loopStart, loopEnd, loopXFade, sampleStartMod)
					sample = ET.SubElement(header, "sample")
					for key, value in json.items():
						sample.set(key, str(value))

			# "Prettify" 
			rough_string = ET.tostring(header, 'utf-8')
			parsed_string = minidom.parseString(rough_string)
			pretty_xml = parsed_string.toprettyxml(indent="  ")

			# Write Out
			with open(xml_wgRight + '.xml', "w") as file:
				file.write(pretty_xml)

			print("Saved Waveguide.")

		# Residue
		if BUILD_RESIDUE:
			header = createXMLSampleMapHeader(xml_rsRight)
			tree = ET.ElementTree(header)
			
			for root, dirs, files in os.walk(rsRight):
				for name in files:
					root, loKey, hiKey, loVel, hiVel, rrGroup, fileName, loopEnabled, loopStart, loopEnd, loopXFade, sampleStartMod = parseResidue(name, right=True)
					json = createJSONFromParse(root, loKey, hiKey, loVel, hiVel, rrGroup, fileName, loopEnabled, loopStart, loopEnd, loopXFade, sampleStartMod)
					sample = ET.SubElement(header, "sample")
					for key, value in json.items():
						sample.set(key, str(value))

			# "Prettify" 
			rough_string = ET.tostring(header, 'utf-8')
			parsed_string = minidom.parseString(rough_string)
			pretty_xml = parsed_string.toprettyxml(indent="  ")

			# Write Out
			with open(xml_rsRight + '.xml', "w") as file:
				file.write(pretty_xml)

			print("Saved Residue Left.")


