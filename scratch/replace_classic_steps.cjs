const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'src', 'components', 'Timeline.tsx');
const content = fs.readFileSync(file, 'utf8');

// Find the index of // -------------------- MODE CLASSIQUE (Vertical Timeline complet) --------------------
const classicComment = "MODE CLASSIQUE (Vertical Timeline complet)";
const classicIndex = content.indexOf(classicComment);
if (classicIndex === -1) {
  console.error("Could not find classic mode comment!");
  process.exit(1);
}

// Find {isActive ? ( after the comment
const searchStr = "{isActive ? (";
const isActiveIndex = content.indexOf(searchStr, classicIndex);
if (isActiveIndex === -1) {
  console.error("Could not find isActive ? ( index!");
  process.exit(1);
}

// Find the end line of that block.
// The block ends with a specific sequence:
//                         )}
//                       </motion.div>
//                     )}
// 
//                     {!isExpanded && (
const endMarker = "                        )}\r\n                      </motion.div>";
const endMarkerLF = "                        )}\n                      </motion.div>";

let endIndex = content.indexOf(endMarker, isActiveIndex);
let markerUsed = endMarker;
if (endIndex === -1) {
  endIndex = content.indexOf(endMarkerLF, isActiveIndex);
  markerUsed = endMarkerLF;
}

if (endIndex === -1) {
  console.error("Could not find end marker!");
  process.exit(1);
}

// Calculate the end of the isActive ? block (before </motion.div>)
const targetEndIndex = endIndex + "                        )}".length;

const before = content.substring(0, isActiveIndex);
const after = content.substring(targetEndIndex);

const replacement = `{isActive ? (
                          <div className="glass-premium rounded-2xl p-5 md:p-6 border border-accent/30 shadow-md">
                            <p className="font-sans text-xs md:text-sm text-slate-655 leading-relaxed mb-4">
                              {step.details || step.description}
                            </p>
                            {renderStepContent(step.id)}
                          </div>
                        ) : (
                          <div className="bg-white/70 rounded-xl p-4 border border-neutral-200 text-xs text-secondary leading-relaxed shadow-sm">
                            <p>{step.details || step.description}</p>
                            {isCompleted && (
                              <div className="flex items-center gap-1.5 text-accent font-bold mt-2.5 font-sans">
                                <svg viewBox="0 0 24 24" className="w-4 h-4 text-accent" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12l5 5L20 7" /></svg>
                                <span>Étape validée et enregistrée.</span>
                              </div>
                            )}
                          </div>
                        )}`;

fs.writeFileSync(file, before + replacement + after, 'utf8');
console.log("Successfully replaced Classic Mode step details block in Timeline.tsx!");
