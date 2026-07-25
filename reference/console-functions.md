# Console functions

Functions registered by the engine, callable from any script. Signatures are the engine's own usage
strings, extracted from `Tribes2.exe` **[binary]** — the engine stores each function's usage text in
`.rdata` beside its registration site, so these are the authoritative spellings and argument names.

Around 330 functions are registered. This page covers the ones a modder uses; the omitted remainder are
GL debug wrappers, WON account plumbing, and IRC client internals.

> Argument names come from Sierra. Where a signature shows `[optional]` or `{, optional}` the brackets are
> the engine's own notation.

## Strings

```
strlen(str)                                strstr(string, substr)
strcmp(one, two)                           stricmp(one, two)
strchr(string,char)                        strcspn(string, characters)
strlwr(string)                             strupr(string)
strreplace(string, from, to)               stripChars( string, chars )
stripTrailingSpaces( string )              StripMLControlChars(string);
getSubStr(string, start, numChars)         nextToken(str,token,delim)
trim(string)   ltrim(string)   rtrim(string)
expandEscape(text)                         collapseEscape(text)
getExpandedStrlen(str);                    filterString(baseString,replacementChars);
firstWord(text)                            restWords(text)
formatTimeString(timeformat);              strToPlayerName( string )
```

## The word / field / record family

The three-level string model. See [TorqueScript](../02-engine-model/torquescript.md#the-three-level-string-data-model).

```
getWord(text, index [,endIndex])           getWordCount(text)
getField(text, index)                      getFieldCount(text)
getFields(text, index [,endIndex])
getRecord(text, index)                     getRecordCount(text)
getRecords(text, index [,endIndex])
```

`setWord` and `setField` also exist and are used by the shipped scripts **[script]**.

| Level | Delimiter |
|---|---|
| Word | space |
| Field | tab |
| Record | newline |

## Tagged strings

```
addTaggedString(string)                    getTaggedString(tag)
removeTaggedString(tag)                    detag(textTagString)
getTag(textTagString)                      buildTaggedString(fmtTag, <arg1, ...arg9>);
```

## Math

```
mAbs(float)          mFloor(float)        mCeil(float)         mSqrt(float)
mPow(float, float)   mLog(float)          mMod(num, div)
mSin(float)          mCos(float)          mTan(float)
mAsin(float)         mAcos(float)         mAtan(float, float)
mDegToRad(float)     mRadToDeg(float)
mFloatLength(float, numDecimals)           mFormatFloat(val, format)
mSolveCubic(a,b,c,d)                       mSolveQuartic(a,b,c,d,e)
getRandom([[max]||[min,max]])              setRandomSeed([seed])   getRandomSeed()
MathInit(detect|C|FPU|MMX|3DNOW|SSE|...)
```

## Vectors and matrices

```
VectorAdd(vec1,vec2)         VectorSub(vec1,vec2)
VectorScale(vec,scaler)      VectorNormalize(vec)
VectorDot(vec1,vec2)         VectorCross(vec1,vec2)
VectorLen(vec)               VectorDist(vec1,vec2)
VectorOrthoBasis(AngAxisF)
MatrixCreate(Pos, Rot)       MatrixCreateFromEuler("x y z")
MatrixMultiply(Left, Right)  MatrixMulPoint(transform, point)
MatrixMulVector(transform, vector)
getBoxCenter(Box)
```

Vectors are three-word strings; transforms are seven words (position + axis-angle).

## Objects and script control

```
isObject(object)                           nameToID(object)
exec(fileName [, nocalls [,journalScript]])
compile(fileName)                          eval(consoleString)
call(funcName [,args ...])
schedule(...)                              cancel(eventId)
getSimTime();                              getRealTime()
export(searchString [, fileName [,append]])
deleteVariables(wildCard)
deleteDataBlocks();
```

## Packages

```
activatePackage(packageName)               deactivatePackage(packageName)
isPackage(packageName)
```

See [Packages](../02-engine-model/packages.md), and note that `console_start.cs` wraps
`activatePackage` / `deactivatePackage` with the `PackageFix` package **[script]**. The engine also has a
package limit — `ActivatePackage(%s) failed - Max package limit reached: %d` **[binary]**.

## Mod paths and files

```
setModPaths( paths )                       getModPaths()
rebuildModPaths();                         setPureServer(bool);
isPureServer();                            cdFileCheck(fileName, volume, serial)

findFirstFile(pattern)                     findNextFile(pattern)
getFileCount(pattern)                      isFile(fileName)
fileBase(fileName)                         fileExt(fileName)      filePath(fileName)
getFileCRC(filename)                       getFileCreateTime(filename)
getFileModifyTime(filename)                isWriteableFileName(fileName)
deleteFile(fileName)                       renameFile(currentName, newName)
```

See [Mod paths and overrides](../02-engine-model/mod-paths-and-overrides.md).

## Container searches and ray casts

```
InitContainerRadiusSearch("x y z", radius, mask)
ContainerSearchNext()
ContainerSearchCurrDist()
ContainerSearchCurrRadDamageDist()
ContainerRayCast("x y z", "x y z", mask, [exempt object])
ContainerBoxEmpty(Mask, Loc, Rad [,yRad, zRad]);
containerFindFirst(type, point, x, y, z)   containerFindNext()
isPointInside(point)
getTerrainHeight(pos);
```

Searches are **not re-entrant** — collect results into an array before starting another. See
[Damage and type masks](../03-content-recipes/damage-and-typemasks.md#the-search-and-cast-api).

## Networking

```
commandToServer(func, <arg1,...argn>);
commandToClient(client, func, <arg1,...argn>);
connect(addr);                             localConnect();
allowConnections(bool);                    setNetPort(port);
disableCyclingConnections(true|false)
DNetSetLogging(bool);
launchDedicatedServer( missionType, map, botCount{, pureServer} )
startHeartbeat()                           stopHeartbeat();
```

## Server queries

```
queryLanServers( port{, flags} )
queryMasterServer( port{, flags{, rulesSet{, missionType{, minPlayers{, maxPlayers{,
                   maxBots{, regionMask{, maxPing{, minCPUSpeed{, filterFlags{, buddyList }}}}}}}}}}} )
queryFavoriteServers( {, flags} )          querySingleServer( address{, flags} )
queryMasterGameTypes()                     findServer( searchPattern )
findNextServer()                           cancelServerQuery()
stopServerQuery()                          isServerQueryActive()
getServerStatusString();                   getServerGUIDList();
pushServerAddress( address )
```

## Targets and sensors

The target system drives the HUD, the command map, and AI awareness.

```
allocTarget(nameTag, skinTag, voiceTag, typeTag, sensorGroup, dataBlockId, voicePitch, [prefskin])
freeTarget(targetId)                       resetTargets()
getTargetName(targetId)                    setTargetName(targetId, nameTag)
getTargetType(targetId)                    setTargetType(targetId, typeTag)
getTargetSkin(targetId)                    setTargetSkin(targetId, skinTag)
getTargetVoice(targetId)                   setTargetVoice(targetId, voiceTag)
getTargetVoicePitch(targetId)              setTargetVoice(targetId, voicePitch)
getTargetSensorData(targetId)              setTargetSensorData(targetId, sensorData)
getTargetSensorGroup(targetId)             setTargetSensorGroup(targetId, sensorGroup)
getTargetDataBlock(targetId)               setTargetDataBlock(targetId, dataBlockId)
getTargetObject(targetId)                  getTargetGameName(targetId)
getTargetRender(targetId)                  setTargetRender(targetId, mask)
getTargetAlwaysVisMask(target)             setTargetAlwaysVisMask(target, mask)
getTargetNeverVisMask(target)              setTargetNeverVisMask(target, mask)
getTargetFriendlyMask(target)              setTargetFriendlyMask(target, mask)
isTargetFriendly(target, sensorGroup)      isTargetVisible(target, sensorGroup)
createClientTarget(targetId, <x y z>)      sendTargetsToClient(connection)
resetClientTargets(connection, tasksOnly)  removeClientTargetType(client, type)
playTargetAudio(target, fileTag, desc, update)
setBeaconNames(target, marker, vehicle)

getSensorGroupCount()                      setSensorGroupCount(count)
getSensorGroupColor(sensorGroup, colorGroup)      setSensorGroupColor(sensorGroup, groupMask, color)
getSensorGroupAlwaysVisMask(sensorGroup)          setSensorGroupAlwaysVisMask(sensorGroup, mask)
getSensorGroupNeverVisMask(sensorGroup)           setSensorGroupNeverVisMask(sensorGroup, mask)
getSensorGroupFriendlyMask(sensorGroup)           setSensorGroupFriendlyMask(sensorGroup, mask)
getSensorGroupListenMask(sensorGroup)             setSensorGroupListenMask(sensorGroup, mask)
```

`DefaultGame::missionLoadDone` is where the sensor groups are configured **[script]**.

## Audio

```
alxCreateSource(profile, {x,y,z} | description, filename, {x,y,z})
alxPlay(handle) | alxPlay(profile, {x,y,z})
alxStop(handle)                            alxStopAll()
alxPlayMusic(file)                         alxStopMusic()
alxGetWaveLen(profile|filename)
alxGetChannelVolume(channel)               alxSetChannelVolume(channel, volume)
alxListenerf(ALenum, value)                alxListener3f(ALenum, "x y z" | x, y, z)
alxGetListenerf(Alenum)                    alxGetListener3f(Alenum)   alxGetListeneri(Alenum)
alxSourcef(handle, ALenum, value)          alxSource3f(handle, ALenum, "x y z" | x, y, z)
alxSourcei(handle, ALenum, value)
alxGetSourcef(handle, ALenum)              alxGetSource3f(handle, ALenum)   alxGetSourcei(handle, ALenum)
alxEnvironmentf(Alenum, value)             alxEnvironmenti(Alenum, value)
alxGetEnvironmentf(Alenum)                 alxGetEnvironmenti(Alenum)
alxSetEnvironment(AudioEnvironmentData)    alxEnableEnvironmental(bool)
alxEnableForceFeedback(bool)               alxDisableOuterFalloffs(bool)
alxForceMaxDistanceUpdate(bool)
alxSetInnerFalloffScale(scale)             alxGetInnerFalloffScale()
alxIsEnabled(name)                         alxIsExtensionPresent(name)
alxContexti(Alenum, value)                 alxGetContexti(Alenum)   alxGetContextstr(Alenum, idx)
alxCaptureInit()   alxCaptureStop()   alxCaptureDestroy()   alxIsCapturing()
alxGetCaptureGainScale()                   alxSetCaptureGainScale(scale)
AudioSetDriver(name)                       AudioDetect()   AudioDestroy()
getAudioDriverList();                      getAudioDriverInfo();
setPowerAudioProfiles(powerUp, powerDown)
redbookPlay(track)   redbookStop()   redbookClose()
redbookGetTrackCount()   redbookGetDeviceCount()   redbookGetDeviceName(idx)   redbookGetLastError()
```

See [Audio](../03-content-recipes/audio.md).

## Video and display

```
createCanvas();                            resetCanvas();
setResolution( width, height, bpp );       setRes( width, height, bpp );
setScreenMode( width, height, bpp, fullScreen );
getResolution();                           getResolutionList( deviceName );
getDesktopResolution()                     nextResolution();   prevResolution();
switchBitDepth();                          toggleFullScreen();   isFullScreen();
setDisplayDevice( deviceName{, width{, height{, bpp{, fullScreen}}}}} );
getDisplayDeviceList();                    isDeviceFullScreenOnly( deviceName );
getVideoDriverInfo();                      setVerticalSync( <bool> )
setGammaCorrection(gamma);
setFov(fov);   setDefaultFov(defaultFov);  setZoomSpeed(speed);
setShadowDetailLevel(val 0...1);
setTextureCompressionHint(GL_DONT_CARE|GL_FASTEST|GL_NICEST);
flushTextureCache()   clearTextureHolds();   purgeResources();
resetLighting();                           echoTerrainTextures();
startFade( U32, U32, bool )
screenShot(file);                          panoramaScreenShot(file);
```

## Input

```
enableMouse()   disableMouse()   lockMouse(isLocked);
enableJoystick()   disableJoystick()   isJoystickDetected()   getJoystickAxes( instance )
activateKeyboard()   deactivateKeyboard()
activateDirectInput()   deactivateDirectInput()
echoInputState()
enableImmersion(bool);   isImmersionEnabled()
getClipboard()   setClipboard(text)
```

## Debugging

```
echo(text [, ... ])      warn(text [, ... ])      error(text [, ... ])
trace(bool)              cls()
setLogMode(mode);        setEchoFileLoads(bool);
enableWinConsole(bool);
telnetSetParameters(port,consolePass,listenPass)
dbgSetParameters(port,pass);
backtrace();             callDebugFunction()
FreeMemoryDump();
ProfilePatch1(func, args...);   ProfilePatch2(func, args...);
saveJournal(jname);   loadJournal(jname);
startRecord(fileName)   stopRecord();   playDemo(recFileName)   stopDemoPlayback()
isRecordingDemo()   isPlayingDemo()   getDemoCurrentTime()   getDemoVersion()
getDemoVersionLength(recFileName)
```

See [Debugging](../06-shipping/debugging.md).

## World and gameplay

```
getGravity();                              setGravity(gravityAmt);
getControlObjectSpeed();                   getControlObjectAltitude();
startEffect(name [,iter])                  stopEffect(name)
setDeployRotation( normal )
pathOnMissionLoadDone()
navGraphExists();                          AIGetPathDistance(fromPoint, toPoint);
NavDetectForceFields();
aiConnect(name [, team , skill, offense, voice, voicePitch]);
makeTestTerrain(fileName, {dml1, dml2, ...dml8} );
```

## Player database and moderation

```
loadPlayerDatabase( filename )             savePlayerDatabase()
queryPlayerDatabase( guid )
setPlayerTextMuted( guid, isMuted )        setPlayerVoiceMuted( guid, isMuted )
addBadWord(someReallyNastyWord);           containsBadWords(text);
```

## Build and environment queries

```
getT2VersionNumber()     ← returns 25034 on the patched v1.05 build [binary]
isDemo()    isAddon()    isKoreanBuild()    isT2UKBuild()
quit()      gotoWebPage( address )
```

## Shape viewer

The `-show` launch mode's API. Useful for previewing `.dts` assets:

```
showShapeLoad(shapeName,faceCamera);       showSequenceLoad(sequenceFile,[sequenceName]);
startShow();                               showNewThread();   showDeleteThread(threadNum);
showPlay([threadNum]);                     showSelectSequence();
showSetPos(threadNum,pos);                 showSetScale(threadNum,scale);
showSetCamera(orbitShape);                 showSetKeyboard(moveShape);
showSetLightDirection();                   showSetDetailSlider();
showSetFileList(path,ext,command);         showUpdateThreadControl();
showToggleRoot();                          showToggleStick();
showTurnLeft(amt);                         showTurnRight(amt);
snapToggle();
```

```bash
Tribes2.exe -show
```

## Object methods

The functions above are global. Object *methods* — `%obj.getPosition()`, `%obj.mountImage()`,
`%obj.setInventory()` and the rest — are registered per class and are far more numerous. The reliable way
to enumerate them is:

```php
%obj.dump();
```

which prints every field and method for that object's class chain. See
[Debugging](../06-shipping/debugging.md#dump--the-object-inspector).

## Under the community patches

Everything above is vanilla and still present. TribesNEXT's `IFC22.dll` registers roughly 30 more at
`DllMain` time **[binary]**. **These do not exist on an unpatched install** — guard before calling, or
your mod errors on vanilla.

### Video and display

```
setRenderScale(float)          getRenderScale()
setUIScale(float)              getUIScale(int)        ← 0, 1, or 2
setUIAspect(float)
setVerticalSync(bool)
setFramerateLimit(int)
setOpenGLAntiAliasing(int)     ← driven by $OpenGL::maxMSAA
setOpenGLTextureFilter(string) ← "TRILINEAR" | "BILINEAR" | "NEAREST"
setDXGIInteropEnable(bool)     ← paired with the $DXGISupported global
```

### Audio

```
alxGetContexti(ALenum)              ← ALC_PROVIDER_COUNT, ALC_PROVIDER,
                                       ALC_SPEAKER_COUNT, ALC_SPEAKER
alxGetContextstr(ALenum, idx)       ← ALC_PROVIDER_NAME, ALC_SPEAKER_NAME
alxIsExtensionPresent(string)       ← e.g. "EAX"
alxEnableEnvironmental(bool)
```

### Input

```
enableJoystick(bool)
getJoystickAxes(instance)
enableKeyboardTranslation(bool)
getMouseAdjustAmount(float)
```

### Network and engine

```
enableIPv6(bool)              ← vanilla Tribes 2 is IPv4-only
enableAssetDownloads(bool)    ← paired with $pref::Net::downloadAssets
enableHybridTerrain(bool)     ← modernised terrain LOD
```

### Crypto and auth

```
sha1sum(...)
t2csri_*(...)                 ← the account, certificate, and signature family
```

These are the patch's own internals. Do not build on them.

### Classes

`HTTPObject` exists in vanilla `Tribes2.exe` **[binary]** but speaks plain HTTP. The patch provides a
libcurl-backed implementation with TLS.

### Replaced by no-op stubs

```
WONInit()          WONServerLogin()
```

and, from `t2csri_server` **[patch-script]**:

```
addGameType()      clearGameTypes()      clearMissionTypes()      sortGameAndMissionTypeLists()
```

All four still exist and can be called; they just do nothing. See
[Gametypes](../05-gameplay-systems/gametypes.md#under-the-community-patches).

`IFC22.dll` also carries an embedded script fragment redefining `dedCheckLoginDone` **[binary]**.

### Guarding

```php
if (isPackage(console_client_patches))
   setUIScale(1.0);
```

or test for the function's effect rather than its existence — an unknown function call produces a console
error but does not halt the script.

### RC2a only

```
rubyExec(scriptPath)     ← reads a .rb file and passes it to rubyEval
rubyEval(code)           ← evaluates Ruby in the embedded interpreter
```

Removed in the QoL rewrite. `$RubyEnabled` is set to `1` when the bridge is live **[patch-script]**.

## Related

- [TorqueScript](../02-engine-model/torquescript.md) — the language these are called from
- [Global variables](global-variables.md) — the `$pref::` surface many of these read
- [Debugging](../06-shipping/debugging.md) — using the diagnostic functions
- [TribesNEXT QoL patch](../07-community-patches/tribesnext-qol.md#new-console-functions) — where these come from
