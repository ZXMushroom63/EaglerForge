const templateClassdef = `
    //classdef for %classname%
    public static void reflect_%classname%_generator(ArrayList<BaseData> reflectProfiles) {
        BaseData reflect_%classname% = new ModData();

        ArrayList<BaseData> reflect_%classname%_constructors = new ArrayList<BaseData>();
        %constructordefs%
        BaseData[] reflect_%classname%_constructors_arr = new BaseData[reflect_%classname%_constructors.size()];
        for (int i = 0; i < reflect_%classname%_constructors_arr.length; i++) {
            reflect_%classname%_constructors_arr[i] = reflect_%classname%_constructors.get(i);
        }

        ArrayList<BaseData> reflect_%classname%_methods = new ArrayList<BaseData>();
        %methoddefs%
        BaseData[] reflect_%classname%_methods_arr = new BaseData[reflect_%classname%_methods.size()];
        for (int i = 0; i < reflect_%classname%_methods_arr.length; i++) {
            reflect_%classname%_methods_arr[i] = reflect_%classname%_methods.get(i);
        }

        reflect_%classname%.set("constructors", reflect_%classname%_constructors_arr);
        reflect_%classname%.set("methods", reflect_%classname%_methods_arr);
        reflect_%classname%.set("className", "%classname%");
        reflect_%classname%.set("classId", "%classid%");
        reflect_%classname%.set("class", %classname%.class);
        reflect_%classname%.setCallbackBooleanWithDataArg("isObjInstanceOf", (args)->{
            return args.getReflective("obj") instanceof %classname%;
        });
        reflectProfiles.add(reflect_%classname%);
    }

`;
//IXCVVIX
//CXVIIVX
//MVVMCXI
const templateConstructor = `
        BaseData reflect_%classname%_constructor_%constructorname%_%idx% = new ModData();
        reflect_%classname%_constructor_%constructorname%_%idx%.set("returnType", %returntype%);
        reflect_%classname%_constructor_%constructorname%_%idx%.set("argnames", %argkeys%);
        reflect_%classname%_constructor_%constructorname%_%idx%.set("argtypes", %argvalues%);
        reflect_%classname%_constructor_%constructorname%_%idx%.%constructorimpl%
        reflect_%classname%_constructors.add(reflect_%classname%_constructor_%constructorname%_%idx%);

`;
const templateMethod = `
        BaseData reflect_%classname%_method_%methodname%_%idx% = new ModData();
        reflect_%classname%_method_%methodname%_%idx%.set("methodName", "%methodname%");
        reflect_%classname%_method_%methodname%_%idx%.set("returnType", %returntype%);
        reflect_%classname%_method_%methodname%_%idx%.set("static", %static%);
        reflect_%classname%_method_%methodname%_%idx%.set("argnames", %argkeys%);
        reflect_%classname%_method_%methodname%_%idx%.set("argtypes", %argvalues%);
        reflect_%classname%_method_%methodname%_%idx%.%methodimpl%
        reflect_%classname%_methods.add(reflect_%classname%_method_%methodname%_%idx%);

`;

const classDefCallTemplate = `        PLReflect.reflect_%classname%_generator(reflectProfiles);
`;
const templateManager = `
import net.eaglerforge.api.*;
import java.util.ArrayList;
import java.lang.Exception;
import org.teavm.jso.JSBody;
import org.teavm.jso.JSObject;
import org.teavm.jso.JSFunctor;

//  _  _     ___      __ _        _   
//  | \\| |___| _ \\___ / _| |___ __| |_ 
//  | .\` / _ \\   / -_)  _| / -_) _|  _|
//  |_|\\_\\___/_|_\\___|_| |_\\___\\__|\\__|
//   _________________________________


//AutoGenerated by NoReflect
//Made by ZXMushroom63

public class PLReflect extends ModData {
    @JSBody(params = { "reflectInst" }, script = "reflectInst.getMethodMapFromClass = function(classObj) {var outMethodMap = {}; classObj.methods.forEach(method=>{outMethodMap[method.methodName]=method;}); return outMethodMap;}")
    public static native BaseData setMethodMapFn(BaseData reflectInst);

    %classdefs%

    public static PLReflect makeModData() {
        PLReflect plReflectGlobal = new PLReflect();
        setMethodMapFn(plReflectGlobal);
        ArrayList<BaseData> reflectProfiles = new ArrayList<BaseData>();
        
%classdefcalls%
        BaseData[] reflectProfilesArr = new BaseData[reflectProfiles.size()];
        for (int i = 0; i < reflectProfilesArr.length; i++) {
            reflectProfilesArr[i] = reflectProfiles.get(i);
        }
        plReflectGlobal.set("classes", reflectProfilesArr);

        plReflectGlobal.setCallbackClassFinder("getClassByName", (String className)->{
            for (int i = 0; i < reflectProfilesArr.length; i++) {
                if (reflectProfilesArr[i].getString("className").equals(className)) {
                    return reflectProfilesArr[i];
                }
            }
            return null;
        });

        plReflectGlobal.setCallbackClassFinder("getClassById", (String classId)->{
            for (int i = 0; i < reflectProfilesArr.length; i++) {
                if (reflectProfilesArr[i].getString("classId").equals(classId)) {
                    return reflectProfilesArr[i];
                }
            }
            return null;
        });

        return plReflectGlobal;
    }
}`;
function wait(d) {
    return new Promise((res, rej)=>{
        setTimeout(()=>{res()}, d*1000);
    });
}
function logClear() {
    document.querySelector("#logs").innerText = "";
}
function logTxt(txt) {
    if (document.querySelector("#logs").innerText === "") {
        document.querySelector("#logs").innerText += txt;
    } else {
        document.querySelector("#logs").innerText += "\n" + txt;
    }
    document.querySelector("#logs").scrollTop = document.querySelector("#logs").scrollHeight;
}
function process(file, reader, classDataDump, className, classId) {
    return new Promise((res, rej)=>{
        reader.addEventListener("load", ()=>{
            var output = reader.result;
            classDataDump[className] = (reconJ(output, className));
            classDataDump[className].classId = classId;
            res(output);
        });
        reader.readAsText(file);
    });
}
function createManagerFile(managerTemplate, config, zip, dataDump, classIdMap) {
    var manager = managerTemplate;
    var filePath = config.managerFile.replaceAll(".", "/") + ".java";

    for (let i = 0; i < config.targetFiles.length; i++) {
        manager = `import ${config.targetFiles[i]}` + ";\n" + manager;
    }
    var imports = [];

    var classText = "";
    var classCallText = "";
    var classes = Object.keys(dataDump);
    for (let i = 0; i < classes.length; i++) {
        const className = classes[i];
        imports = [...new Set(imports.concat(dataDump[className].usedClasses))];

        var tmpClassText = templateClassdef;
        tmpClassText = tmpClassText.replaceAll("%classname%", className);
        tmpClassText = tmpClassText.replaceAll("%classid%", dataDump[className].classId);

        var constructorText = "";
        for (let i = 0; i < dataDump[className].constructors.length; i++) {
            const constructor = dataDump[className].constructors[i];
            var tmpConstructorText = templateConstructor;
            tmpConstructorText = tmpConstructorText.replaceAll("%classname%", className);
            tmpConstructorText = tmpConstructorText.replaceAll("%idx%", constructor.idx);
            tmpConstructorText = tmpConstructorText.replaceAll("%constructorname%", constructor.name);
            tmpConstructorText = tmpConstructorText.replaceAll("%returntype%", "\""+className+"\"");
            tmpConstructorText = tmpConstructorText.replaceAll("%argkeys%", `new String[]{${(()=>{
                var txt = "";
                var argumentKeys = Object.keys(constructor.arguments);
                for (let i = 0; i < argumentKeys.length; i++) {
                    const k = argumentKeys[i];
                    txt += `"${k}"`;
                    if (i !== argumentKeys.length - 1) {
                        txt += ", ";
                    }
                }
                return txt;
            })()}}`);
            tmpConstructorText = tmpConstructorText.replaceAll("%argvalues%", `new String[]{${(()=>{
                var txt = "";
                var argumentKeys = Object.keys(constructor.arguments);
                for (let i = 0; i < argumentKeys.length; i++) {
                    const k = argumentKeys[i];
                    txt += `"${constructor.arguments[k]}"`;
                    if (i !== argumentKeys.length - 1) {
                        txt += ", ";
                    }
                }
                return txt;
            })()}}`);
            tmpConstructorText = tmpConstructorText.replaceAll("%constructorimpl%", constructor.impl);
            constructorText += tmpConstructorText;
        }
        tmpClassText = tmpClassText.replaceAll("%constructordefs%", constructorText);


        var methodText = "";
        for (let i = 0; i < dataDump[className].methods.length; i++) {
            const method = dataDump[className].methods[i];
            var tmpMethodText = templateMethod;
            tmpMethodText = tmpMethodText.replaceAll("%classname%", className);
            tmpMethodText = tmpMethodText.replaceAll("%idx%", method.idx);
            tmpMethodText = tmpMethodText.replaceAll("%static%", method.isStatic);
            tmpMethodText = tmpMethodText.replaceAll("%methodname%", method.name);
            tmpMethodText = tmpMethodText.replaceAll("%returntype%", "\""+method.returnType+"\"");
            tmpMethodText = tmpMethodText.replaceAll("%argkeys%", `new String[]{${(()=>{
                var txt = "";
                var argumentKeys = Object.keys(method.arguments);
                for (let i = 0; i < argumentKeys.length; i++) {
                    const k = argumentKeys[i];
                    txt += `"${k}"`;
                    if (i !== argumentKeys.length - 1) {
                        txt += ", ";
                    }
                }
                return txt;
            })()}}`);
            tmpMethodText = tmpMethodText.replaceAll("%argvalues%", `new String[]{${(()=>{
                var txt = "";
                var argumentKeys = Object.keys(method.arguments);
                for (let i = 0; i < argumentKeys.length; i++) {
                    const k = argumentKeys[i];
                    txt += `"${method.arguments[k]}"`;
                    if (i !== argumentKeys.length - 1) {
                        txt += ", ";
                    }
                }
                return txt;
            })()}}`);
            tmpMethodText = tmpMethodText.replaceAll("%methodimpl%", method.impl);
            methodText += tmpMethodText;
        }

        tmpClassText = tmpClassText.replaceAll("%methoddefs%", methodText);

        classText += tmpClassText;
        classCallText += classDefCallTemplate.replaceAll("%classname%", className);
    }
    for (let i = 0; i < config.imports.length; i++) {
        manager = `import ${config.imports[i]}` + ";\n" + manager;
        logTxt(`Force imported classid: ${config.imports[i]}`);
    }

    if (config.attemptAutoImport) {
        for (let i = 0; i < imports.length; i++) {
            if (classIdMap.has(imports[i])) {
                manager = `import ${classIdMap.get(imports[i])}` + ";\n" + manager;
                logTxt(`Imported classid: ${classIdMap.get(imports[i])}`);
            }
        }
    }

    manager = `package ${config.managerFile.match(/(.*)(?=\.[^.]*$)/g)[0]}` + ";\n" + manager;

    manager = manager.replaceAll("%classdefs%", classText);
    manager = manager.replaceAll("%classdefcalls%", classCallText);

    zip.file(filePath, manager);
}
async function generate(fileList) {
    var classToLocationMap = new Map();
    var cfg;
    var output = new JSZip();
    var classDataDump = {};
    logClear();
    logTxt("[INIT] Build @ "+(new Date()));
    if (!fileList || fileList.length === 0) {
        logTxt("[ERROR] Filelist is empty.")
        return;
    }
    try {
        var cfgString = document.querySelector("#config").value.trim();
        cfgString = cfgString.replace(/\/\/.*$/gm, '');
        cfgString = cfgString.replace(/\/\*[\s\S]*?\*\//gm, '');
        cfg = JSON.parse(cfgString);
    } catch (e) {
        logTxt("[ERROR] Invalid config.");
        return;
    }
    if (!cfg.targetFiles) {
        logTxt("[ERROR] Invalid config.");
    }
    for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (file.webkitRelativePath.endsWith(".java")) {
            var classId = file.webkitRelativePath.replaceAll("java/", "").replaceAll(".java", "").replaceAll("/", ".");
            var className = classId.split(".")[classId.split(".").length - 1];
            classToLocationMap.set(className, classId);
            if (cfg.targetFiles.includes(classId)) {
                logTxt("Found "+classId+" ["+file.name+"], processing...");
                var javaFileContent = await process(file, new FileReader(), classDataDump, className, classId);
                if (cfg.includeReadFiles) {
                    output.file(file.webkitRelativePath.replaceAll("java/", ""), javaFileContent);
                }
            }
        }
    }
    console.log(classDataDump);
    logTxt(`Creating manager file...`);
    createManagerFile(templateManager, cfg, output, classDataDump, classToLocationMap);

    logTxt(`Writing log.txt...`);
    output.file("log.txt", document.querySelector("#logs").innerText);

    output.generateAsync({type:"blob"}).then(function(content) {
        saveAs(content, "patch.zip");
    });
}
window.addEventListener("load", ()=>{
    document.querySelector('#generate').addEventListener("click", ()=>{
        generate(document.querySelector('#data').files);
    });
    logClear();
    logTxt("//Upload the ./src/main/java folder and press generate to begin hook generation");
});