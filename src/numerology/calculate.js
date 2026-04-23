const { CAREER_MAPPINGS, NUMEROLOGY_MEANINGS } = require("./content");

const LETTER_TO_NUMBER = {
  A: 1, J: 1, S: 1,
  B: 2, K: 2, T: 2,
  C: 3, L: 3, U: 3,
  D: 4, M: 4, V: 4,
  E: 5, N: 5, W: 5,
  F: 6, O: 6, X: 6,
  G: 7, P: 7, Y: 7,
  H: 8, Q: 8, Z: 8,
  I: 9, R: 9,
};

const VOWELS = new Set(["A", "E", "I", "O", "U"]);

function normalizeName(name) {
  return (name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Đ/g, "D")
    .replace(/đ/g, "d")
    .toUpperCase()
    .replace(/[^A-Z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function reduceNumber(value, preserveMaster = false) {
  let current = Math.abs(Number(value) || 0);
  while (current > 9) {
    if (preserveMaster && (current === 11 || current === 22)) {
      return current;
    }

    current = current
      .toString()
      .split("")
      .reduce((sum, digit) => sum + Number(digit), 0);
  }

  return current;
}

function sumLetters(name, predicate = () => true) {
  return normalizeName(name)
    .split("")
    .filter((char) => LETTER_TO_NUMBER[char] && predicate(char))
    .reduce((sum, char) => sum + LETTER_TO_NUMBER[char], 0);
}

function calculateLifePath(birthDate) {
  const digits = String(birthDate || "").replace(/\D/g, "");
  if (digits.length !== 8) {
    throw new Error("birthDate phải có định dạng YYYY-MM-DD");
  }

  const total = digits.split("").reduce((sum, digit) => sum + Number(digit), 0);
  return reduceNumber(total, true);
}

function calculateCoreNumbers({ fullName, birthDate }) {
  const lifePath = calculateLifePath(birthDate);
  const destiny = reduceNumber(sumLetters(fullName), true);
  const soulUrge = reduceNumber(sumLetters(fullName, (char) => VOWELS.has(char)), true);

  return { lifePath, destiny, soulUrge };
}

function calculateRadarScores(coreNumbers) {
  const { lifePath, destiny, soulUrge } = coreNumbers;
  const scores = {
    leadership: 45,
    technical: 45,
    empathy: 45,
    creativity: 45,
    discipline: 45,
  };

  if ([1, 8].includes(lifePath)) scores.leadership += 35;
  if ([4, 7].includes(lifePath)) {
    scores.technical += 35;
    scores.discipline += 20;
  }
  if ([2, 6, 9].includes(lifePath)) scores.empathy += 35;
  if ([3, 5].includes(lifePath)) scores.creativity += 25;

  if ([4, 7, 8].includes(destiny)) scores.discipline += 18;
  if ([3, 5].includes(destiny)) {
    scores.creativity += 18;
    scores.leadership += 8;
  }
  if ([2, 6, 9].includes(soulUrge)) scores.empathy += 18;
  if ([1, 8].includes(soulUrge)) scores.leadership += 12;

  Object.keys(scores).forEach((key) => {
    scores[key] = Math.max(25, Math.min(95, scores[key]));
  });

  return scores;
}

function getFallbackMeaning(number) {
  return (
    NUMEROLOGY_MEANINGS.find((item) => item.number === Number(number)) ||
    NUMEROLOGY_MEANINGS.find((item) => item.number === 7)
  );
}

function matchProgram(mapping, { lifePath, educationLevel }) {
  const lifePathMatch =
    !Array.isArray(mapping.lifePathNumbers) || mapping.lifePathNumbers.includes(lifePath);
  const educationMatch =
    !Array.isArray(mapping.educationLevels) || mapping.educationLevels.includes(educationLevel);

  return lifePathMatch && educationMatch;
}

function getSuggestedProgram({ lifePath, educationLevel, mappings }) {
  const items = Array.isArray(mappings) && mappings.length ? mappings : CAREER_MAPPINGS;

  return (
    items.find((item) => matchProgram(item, { lifePath, educationLevel })) ||
    items[items.length - 1]
  );
}

function buildSummary(coreNumbers, radarScores, program, meaning) {
  const currentMeaning = meaning || getFallbackMeaning(coreNumbers.lifePath);

  return {
    title: currentMeaning.title,
    summary: currentMeaning.summary,
    detail: currentMeaning.detail || "",
    strengths: currentMeaning.strengths || [],
    recommendation: `HTO đang ưu tiên gợi ý ${program.title.toLowerCase()} cho hồ sơ này.`,
    note: `Life Path ${coreNumbers.lifePath} kết hợp học vấn hiện tại cho thấy mức phù hợp cao với ${program.title}.`,
    topRadar: Object.entries(radarScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([key]) => key),
  };
}

async function analyzeNumerology(input, repository) {
  const coreNumbers = calculateCoreNumbers(input);
  const radarScores = calculateRadarScores(coreNumbers);
  const [meaning, mappings] = await Promise.all([
    repository?.getMeaningByNumber
      ? repository.getMeaningByNumber(coreNumbers.lifePath)
      : Promise.resolve(null),
    repository?.getCareerMappings
      ? repository.getCareerMappings()
      : Promise.resolve(CAREER_MAPPINGS),
  ]);
  const suggestedProgram = getSuggestedProgram({
    lifePath: coreNumbers.lifePath,
    educationLevel: input.educationLevel,
    mappings,
  });
  const summary = buildSummary(coreNumbers, radarScores, suggestedProgram, meaning);

  return {
    coreNumbers,
    radarScores,
    suggestedProgram,
    summary,
    contentSource:
      repository && repository.constructor && repository.constructor.name === "MongoRepository"
        ? "mongodb"
        : "local_seed",
  };
}

module.exports = {
  analyzeNumerology,
  normalizeName,
};
