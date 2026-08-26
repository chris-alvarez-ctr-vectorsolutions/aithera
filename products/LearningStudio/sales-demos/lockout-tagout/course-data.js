/* ============================================================
   GENERATED FILE — DO NOT EDIT BY HAND

   Built from course.md by _kit/build-course.js.
   Any edit here is lost on the next build; change course.md instead.

     node _kit/build-course.js lockout-tagout
   ============================================================ */

const COURSE = {
  "sku": "CHANGE-ME",
  "title": "Lockout/Tagout",
  "sections": [
    {
      "id": "s01",
      "name": "Introduction",
      "objects": [
        {
          "id": "s01-o01",
          "name": "Introduction",
          "type": "lesson",
          "state": "not-started",
          "objective": "Describe the purpose and scope of lockout/tagout training and identify who is required to complete it",
          "dur": 60,
          "scenes": [],
          "opensManager": false,
          "numbered": 1
        }
      ]
    },
    {
      "id": "s02",
      "name": "Hazardous Energy",
      "objects": [
        {
          "id": "s02-o01",
          "name": "Hazardous Energy",
          "type": "lesson",
          "state": "not-started",
          "objective": "Identify the primary sources of hazardous energy in the workplace and explain why each must be controlled before servicing equipment",
          "dur": 600,
          "scenes": [],
          "opensManager": false,
          "numbered": 1
        }
      ]
    },
    {
      "id": "s03",
      "name": "Lockout/Tagout Program Requirements",
      "objects": [
        {
          "id": "s03-o01",
          "name": "Lockout/Tagout Program Requirements",
          "type": "title-card",
          "state": "not-started",
          "objective": "",
          "dur": 10,
          "scenes": [
            {
              "dur": 10,
              "image": "section3-title-card-img.png",
              "transcript": ""
            }
          ],
          "opensManager": true
        },
        {
          "id": "s03-o02",
          "name": "Authorized Employee Roles and Responsibilities",
          "type": "lesson",
          "state": "not-started",
          "objective": "Distinguish between authorized, affected, and other employees and describe the responsibilities each role carries during a lockout",
          "dur": 72,
          "scenes": [],
          "opensManager": false,
          "numbered": 1
        },
        {
          "id": "s03-o03",
          "name": "Lockout Hardware",
          "type": "lesson",
          "state": "not-started",
          "objective": "Identify standard lockout devices and select the correct hardware for common energy-isolating devices",
          "dur": 60,
          "scenes": [],
          "opensManager": false,
          "numbered": 2
        },
        {
          "id": "s03-o04",
          "name": "Lockout Administration",
          "type": "lesson",
          "state": "not-started",
          "objective": "Explain how written lockout procedures are documented, reviewed, and audited to meet program requirements",
          "dur": 80,
          "scenes": [],
          "opensManager": false,
          "numbered": 3
        },
        {
          "id": "s03-o05",
          "name": "Group Lockout",
          "type": "lesson",
          "state": "not-started",
          "objective": "Apply group lockout procedures so that every authorized employee retains individual control over their own energy isolation",
          "dur": 75,
          "scenes": [],
          "opensManager": false,
          "numbered": 4
        },
        {
          "id": "s03-o06",
          "name": "Lockout Release",
          "type": "lesson",
          "state": "not-started",
          "objective": "Perform the steps required to release equipment from lockout, including verification, notification, and restoring energy safely",
          "dur": 50,
          "scenes": [],
          "opensManager": false,
          "numbered": 5
        },
        {
          "id": "s03-o07",
          "name": "Removal of an Absent Employee's Lockout Device",
          "type": "lesson",
          "state": "not-started",
          "objective": "Describe the specific conditions and approvals required before another employee's lockout device may be removed in their absence",
          "dur": 60,
          "scenes": [],
          "opensManager": false,
          "numbered": 6
        }
      ]
    },
    {
      "id": "s04",
      "name": "Lockout/Tagout Case Study",
      "objects": [
        {
          "id": "s04-o01",
          "name": "Lockout/Tagout Case Study",
          "type": "lesson",
          "state": "not-started",
          "objective": "Analyze a real-world lockout/tagout incident and identify the procedural failures that allowed it to occur",
          "dur": 180,
          "scenes": [],
          "opensManager": false,
          "numbered": 1
        }
      ]
    },
    {
      "id": "s05",
      "name": "Conclusion",
      "objects": [
        {
          "id": "s05-o01",
          "name": "Conclusion",
          "type": "lesson",
          "state": "not-started",
          "objective": "Summarize the core requirements of the lockout/tagout program and locate the resources needed to apply them on the job",
          "dur": 60,
          "scenes": [],
          "opensManager": false,
          "numbered": 1
        }
      ]
    }
  ]
};

/* ---- Derived values -------------------------------------------------
   Durations always roll up from leaves, so nothing is hand-totalled and
   the numbers can't drift from the content. A disabled title card is
   excluded: it won't play, so it contributes no time. */

function fmtMSS(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return m + ':' + String(s).padStart(2, '0');
}

function fmtCourse(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return m + 'm ' + s + 's';
}

function sectionSeconds(section) {
  return section.objects.reduce((sum, o) => sum + (o.disabled ? 0 : o.dur), 0);
}

function courseSeconds(course) {
  return course.sections.reduce((sum, s) => sum + sectionSeconds(s), 0);
}

function courseProgress(course) {
  let done = 0, total = 0;
  course.sections.forEach(s => s.objects.forEach(o => {
    total++;
    if (o.state === 'complete') done++;
  }));
  return { done, total };
}

function findObject(course, objectId) {
  for (const section of course.sections) {
    const obj = section.objects.find(o => o.id === objectId);
    if (obj) return { section, obj };
  }
  return null;
}
