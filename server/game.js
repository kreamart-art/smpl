// "Guess the Sample" — a listener mini-game.
//
// Server-authoritative by design (same stance as vote counting): the answer key
// and grading live ONLY here. The client is handed each question with its four
// options pre-shuffled and UNMARKED; it never sees which one is right until it
// has committed a pick and the server grades it. A score therefore cannot be
// forged — there is no client path that returns "14/14" without actually having
// answered each round correctly through /answer.
//
// The leaderboard is keyed to a real SMPL user id (any role, listeners included)
// — no free-text aliases, so nobody can impersonate a handle on a public board.

// The catalogue. `track`/`artist`/`answer`/`distractors` are proper names and
// stay as-is in every language. Only `fact` is localised (EN/NL — the two langs
// the app ships). Facts are factual; translated, never embellished.
const QUESTIONS = [
  { track: 'Stronger', artist: 'Kanye West', year: 2007,
    answer: 'Daft Punk — "Harder, Better, Faster, Stronger"',
    distractors: ['Kraftwerk — "Trans-Europe Express"', 'Giorgio Moroder — "I Feel Love"', 'Donna Summer — "Hot Stuff"'],
    fact: {
      en: `Kanye looped Daft Punk's 2001 robot-funk anthem and chopped the vocoder hook into his beat. The French duo joined him to play it live at the 2008 Grammys.`,
      nl: `Kanye loopte de robot-funk-hymne van Daft Punk uit 2001 en hakte de vocoder-hook in stukken voor zijn beat. Het Franse duo stond met hem op het podium om het live te spelen bij de Grammy's van 2008.` } },

  { track: 'Ice Ice Baby', artist: 'Vanilla Ice', year: 1990,
    answer: 'Queen & David Bowie — "Under Pressure"',
    distractors: ['The Police — "Every Breath You Take"', 'David Bowie — "Let\'s Dance"', 'Blondie — "Rapture"'],
    fact: {
      en: `That instantly recognizable bassline is lifted straight from the 1981 Queen/Bowie collaboration. Vanilla Ice first claimed it was different, it wasn't, and the originals were eventually credited.`,
      nl: `Die meteen herkenbare baslijn is rechtstreeks overgenomen van de samenwerking tussen Queen en Bowie uit 1981. Vanilla Ice beweerde eerst dat hij anders was, dat was niet zo, en uiteindelijk kregen de originele makers de credits.` } },

  { track: 'U Can\'t Touch This', artist: 'MC Hammer', year: 1990,
    answer: 'Rick James — "Super Freak"',
    distractors: ['Prince — "Kiss"', 'Chic — "Le Freak"', 'James Brown — "Sex Machine"'],
    fact: {
      en: `Hammer built the whole record on Rick James' 1981 funk riff. James sued, won a writing credit, and a Grammy out of it.`,
      nl: `Hammer bouwde de hele plaat op de funkriff van Rick James uit 1981. James klaagde hem aan, kreeg een schrijverscredit, en er een Grammy bovenop.` } },

  { track: 'Crazy in Love', artist: 'Beyoncé', year: 2003,
    answer: 'The Chi-Lites — "Are You My Woman? (Tell Me So)"',
    distractors: ['Earth, Wind & Fire — "September"', 'The Jackson 5 — "I Want You Back"', 'Kool & the Gang — "Celebration"'],
    fact: {
      en: `Producer Rich Harrison flipped the horn stab from the Chi-Lites' 1970 soul cut into that unmistakable 'uh-oh' fanfare.`,
      nl: `Producer Rich Harrison verbouwde de blazersstoot uit het soulnummer van The Chi-Lites uit 1970 tot die onmiskenbare 'uh-oh'-fanfare.` } },

  { track: 'I\'ll Be Missing You', artist: 'Puff Daddy', year: 1997,
    answer: 'The Police — "Every Breath You Take"',
    distractors: ['Phil Collins — "In the Air Tonight"', 'Sting — "Fields of Gold"', 'Hall & Oates — "Maneater"'],
    fact: {
      en: `Built on the Police's 1983 guitar figure as a tribute to The Notorious B.I.G., though Sting reportedly ended up with the lion's share of the royalties.`,
      nl: `Gebouwd op de gitaarfiguur van The Police uit 1983 als eerbetoon aan The Notorious B.I.G., al zou Sting uiteindelijk het leeuwendeel van de royalty's hebben opgestreken.` } },

  { track: 'Gold Digger', artist: 'Kanye West', year: 2005,
    answer: 'Ray Charles — "I Got a Woman"',
    distractors: ['Otis Redding — "Dock of the Bay"', 'Sam Cooke — "A Change Is Gonna Come"', 'Marvin Gaye — "Let\'s Get It On"'],
    fact: {
      en: `Jamie Foxx, fresh off playing Ray Charles in the film 'Ray', re-sang the hook that interpolates Charles' 1954 classic.`,
      nl: `Jamie Foxx, net na zijn rol als Ray Charles in de film 'Ray', zong de hook opnieuw in, die de klassieker van Charles uit 1954 interpoleert.` } },

  { track: 'Stan', artist: 'Eminem', year: 2000,
    answer: 'Dido — "Thank You"',
    distractors: ['Sarah McLachlan — "Angel"', 'Natalie Imbruglia — "Torn"', 'Sinéad O\'Connor — "Nothing Compares 2 U"'],
    fact: {
      en: `The haunting backdrop loops Dido's then-obscure song; the track's huge success helped vault her into stardom.`,
      nl: `Het beklemmende decor loopt Dido's toen nog onbekende nummer; het enorme succes van de track hielp haar naar de sterrenstatus.` } },

  { track: 'Paper Planes', artist: 'M.I.A.', year: 2007,
    answer: 'The Clash — "Straight to Hell"',
    distractors: ['The Ramones — "Blitzkrieg Bop"', 'Joy Division — "Love Will Tear Us Apart"', 'Talking Heads — "Once in a Lifetime"'],
    fact: {
      en: `The dreamy guitar loop comes from the Clash's 1982 track. The band's surviving members signed off on the sample.`,
      nl: `De dromerige gitaarloop komt uit het nummer van The Clash uit 1982. De nog levende bandleden gaven toestemming voor de sample.` } },

  { track: 'Right Round', artist: 'Flo Rida', year: 2009,
    answer: 'Dead or Alive — "You Spin Me Round (Like a Record)"',
    distractors: ['Wham! — "Wake Me Up Before You Go-Go"', 'Rick Astley — "Never Gonna Give You Up"', 'a-ha — "Take On Me"'],
    fact: {
      en: `The chorus reworks the 1984 hi-NRG smash that made Pete Burns a household name.`,
      nl: `Het refrein bewerkt de hi-NRG-hit uit 1984 die Pete Burns een begrip maakte.` } },

  { track: 'Hotline Bling', artist: 'Drake', year: 2015,
    answer: 'Timmy Thomas — "Why Can\'t We Live Together"',
    distractors: ['Bill Withers — "Ain\'t No Sunshine"', 'Al Green — "Let\'s Stay Together"', 'Gil Scott-Heron — "The Bottle"'],
    fact: {
      en: `That spare, woozy organ groove is built almost entirely on Timmy Thomas' lonely 1972 drum-machine ballad.`,
      nl: `Die kale, zweverige orgelgroove is bijna volledig gebouwd op Timmy Thomas' eenzame drummachine-ballad uit 1972.` } },

  { track: 'Levels', artist: 'Avicii', year: 2011,
    answer: 'Etta James — "Something\'s Got a Hold on Me"',
    distractors: ['Aretha Franklin — "Respect"', 'Nina Simone — "Feeling Good"', 'Tina Turner — "River Deep – Mountain High"'],
    fact: {
      en: `The euphoric vocal hook is sampled from Etta James' 1962 gospel-soul belter, the same line Flo Rida also borrowed for 'Good Feeling'.`,
      nl: `De euforische zang-hook is gesampled uit Etta James' gospel-soul-kraker uit 1962, dezelfde regel die Flo Rida ook leende voor 'Good Feeling'.` } },

  { track: 'Gangsta\'s Paradise', artist: 'Coolio', year: 1995,
    answer: 'Stevie Wonder — "Pastime Paradise"',
    distractors: ['Marvin Gaye — "What\'s Going On"', 'Curtis Mayfield — "Move On Up"', 'Bill Withers — "Lean on Me"'],
    fact: {
      en: `Coolio rebuilt Stevie Wonder's 1976 track almost note-for-note; Wonder reportedly approved it only after the profanity was toned down.`,
      nl: `Coolio bouwde Stevie Wonders nummer uit 1976 bijna noot voor noot na; Wonder gaf naar verluidt pas toestemming nadat het grove taalgebruik was afgezwakt.` } },

  { track: 'Mo Money Mo Problems', artist: 'The Notorious B.I.G.', year: 1997,
    answer: 'Diana Ross — "I\'m Coming Out"',
    distractors: ['Donna Summer — "I Feel Love"', 'Sister Sledge — "We Are Family"', 'Gloria Gaynor — "I Will Survive"'],
    fact: {
      en: `That shiny disco riff is straight off Diana Ross' 1980 anthem, itself crafted by Chic's Nile Rodgers and Bernard Edwards.`,
      nl: `Die glanzende discoriff komt rechtstreeks van Diana Ross' hymne uit 1980, die op zijn beurt werd geschreven door Nile Rodgers en Bernard Edwards van Chic.` } },

  { track: 'Break My Soul', artist: 'Beyoncé', year: 2022,
    answer: 'Robin S — "Show Me Love"',
    distractors: ['CeCe Peniston — "Finally"', 'Crystal Waters — "Gypsy Woman"', 'Black Box — "Ride on Time"'],
    fact: {
      en: `The pumping organ stab revives Robin S's 1993 house classic, a cornerstone of the genre Beyoncé saluted across the 'Renaissance' album.`,
      nl: `De stuwende orgelstoot blaast Robin S' house-klassieker uit 1993 nieuw leven in, een hoeksteen van het genre dat Beyoncé eerde op het album 'Renaissance'.` } },

  // ---- LEVELS 2+ : verified famous samples (auto-curated, iTunes-findable) ----
  { track: "Hung Up", artist: "Madonna", year: 2005,
    answer: "ABBA — \"Gimme! Gimme! Gimme! (A Man After Midnight)\"",
    distractors: ["ABBA — \"Voulez-Vous\"","Boney M. — \"Daddy Cool\"","Donna Summer — \"I Feel Love\""],
    fact: { en: "Hung Up samples the synth melody from ABBA's 1979 song Gimme! Gimme! Gimme! (A Man After Midnight).", nl: "Hung Up sampelt de synthmelodie uit ABBA's nummer Gimme! Gimme! Gimme! uit 1979." } },
  { track: "7 rings", artist: "Ariana Grande", year: 2019,
    answer: "Rodgers & Hammerstein — \"My Favorite Things\"",
    distractors: ["Julie Andrews — \"Do-Re-Mi\"","Frank Sinatra — \"My Way\"","Judy Garland — \"Over the Rainbow\""],
    fact: { en: "Ariana Grande's 7 rings interpolates My Favorite Things from The Sound of Music, and Rodgers and Hammerstein got a writing credit plus the bulk of the royalties.", nl: "Ariana Grande's 7 rings interpoleert My Favorite Things uit The Sound of Music, en Rodgers en Hammerstein kregen een schrijfcredit plus het grootste deel van de royalty's." } },
  { track: "Mambo No. 5 (A Little Bit Of...)", artist: "Lou Bega", year: 1999,
    answer: "Pérez Prado — \"Mambo No. 5\"",
    distractors: ["Tito Puente — \"Oye Como Va\"","Xavier Cugat — \"Brazil\"","Desi Arnaz — \"Babalu\""],
    fact: { en: "Lou Bega's hit interpolates the brass riff of Cuban bandleader Pérez Prado's 1949 instrumental Mambo No. 5, adding new lyrics.", nl: "De hit van Lou Bega gebruikt de blazersriff van Pérez Prado's instrumentale Mambo No. 5 uit 1949 met nieuwe tekst." } },
  { track: "Hypnotize", artist: "The Notorious B.I.G.", year: 1997,
    answer: "Herb Alpert — \"Rise\"",
    distractors: ["Bob James — \"Nautilus\"","Idris Muhammad — \"Could Heaven Ever Be Like This\"","Lonnie Liston Smith — \"A Garden of Peace\""],
    fact: { en: "The bassline and groove come from Herb Alpert's 1979 instrumental Rise, looped throughout the track.", nl: "De baslijn en groove komen uit Herb Alperts instrumentale Rise uit 1979, door de hele track geloopt." } },
  { track: "California Love", artist: "2Pac", year: 1995,
    answer: "Joe Cocker — \"Woman to Woman\"",
    distractors: ["Bill Withers — \"Use Me\"","The Undisputed Truth — \"Smiling Faces Sometimes\"","War — \"Low Rider\""],
    fact: { en: "The main riff interpolates Joe Cocker's 1972 Woman to Woman, with Roger Troutman on talk box.", nl: "Het hoofdriff is een interpolatie van Joe Cockers Woman to Woman uit 1972, met Roger Troutman op talkbox." } },
  { track: "Nuthin' but a 'G' Thang", artist: "Dr. Dre", year: 1992,
    answer: "Leon Haywood — \"I Want'a Do Something Freaky to You\"",
    distractors: ["Bootsy Collins — \"I'd Rather Be with You\"","The Gap Band — \"Outstanding\"","Funkadelic — \"(Not Just) Knee Deep\""],
    fact: { en: "Dr. Dre built the beat around Leon Haywood's 1975 I Want'a Do Something Freaky to You.", nl: "Dr. Dre bouwde de beat rond Leon Haywoods I Want'a Do Something Freaky to You uit 1975." } },
  { track: "It Was a Good Day", artist: "Ice Cube", year: 1992,
    answer: "The Isley Brothers — \"Footsteps in the Dark\"",
    distractors: ["The Dramatics — \"In the Rain\"","The Stylistics — \"People Make the World Go Round\"","The Delfonics — \"La-La (Means I Love You)\""],
    fact: { en: "The smooth backdrop loops The Isley Brothers' 1977 Footsteps in the Dark.", nl: "De zachte backing loopt The Isley Brothers' Footsteps in the Dark uit 1977." } },
  { track: "Dear Mama", artist: "2Pac", year: 1995,
    answer: "The Spinners — \"Sadie\"",
    distractors: ["The Chi-Lites — \"Have You Seen Her\"","The Intruders — \"I'll Always Love My Mama\"","The O'Jays — \"Family Reunion\""],
    fact: { en: "The chorus interpolates The Spinners' 1974 tribute Sadie, with a Joe Sample piano sample underneath.", nl: "Het refrein interpoleert The Spinners' eerbetoon Sadie uit 1974, met daaronder een pianosample van Joe Sample." } },
  { track: "Can I Kick It?", artist: "A Tribe Called Quest", year: 1990,
    answer: "Lou Reed — \"Walk on the Wild Side\"",
    distractors: ["Curtis Mayfield — \"Move On Up\"","Dr. John — \"Right Place Wrong Time\"","Average White Band — \"School Boy Crush\""],
    fact: { en: "The bassline rides Lou Reed's 1972 Walk on the Wild Side, with Reed taking the publishing royalties.", nl: "De baslijn rijdt op Lou Reeds Walk on the Wild Side uit 1972, waarbij Reed de publishingroyalty's opstreek." } },
  { track: "Through the Wire", artist: "Kanye West", year: 2003,
    answer: "Chaka Khan — \"Through the Fire\"",
    distractors: ["Patti LaBelle — \"If Only You Knew\"","Anita Baker — \"Sweet Love\"","Deniece Williams — \"Free\""],
    fact: { en: "Kanye West sped up and sampled Chaka Khan's 1984 ballad 'Through the Fire' for his debut single, recorded while his jaw was wired shut after a car crash.", nl: "Kanye West versnelde en sampelde Chaka Khans ballad 'Through the Fire' uit 1984 voor zijn debuutsingle, opgenomen met zijn kaak gedraad na een auto-ongeluk." } },
  { track: "Work It", artist: "Missy Elliott", year: 2002,
    answer: "Run-DMC — \"Peter Piper\"",
    distractors: ["Run-DMC — \"It's Tricky\"","Rob Base & DJ E-Z Rock — \"It Takes Two\"","Whodini — \"Five Minutes of Funk\""],
    fact: { en: "Missy Elliott's 'Work It' samples the cowbell and 'Peter Piper picked' phrasing from Run-DMC's 1986 track 'Peter Piper'.", nl: "Missy Elliotts 'Work It' sampelt de koebel en de 'Peter Piper'-frasering uit Run-DMC's nummer 'Peter Piper' uit 1986." } },
  { track: "Slow Jamz", artist: "Twista", year: 2003,
    answer: "Luther Vandross — \"A House Is Not a Home\"",
    distractors: ["Marvin Gaye — \"Distant Lover\"","Teddy Pendergrass — \"Love T.K.O.\"","Smokey Robinson — \"Cruisin'\""],
    fact: { en: "Produced by Kanye West, Twista's 'Slow Jamz' samples Luther Vandross's 1981 rendition of 'A House Is Not a Home'.", nl: "Geproduceerd door Kanye West, sampelt Twista's 'Slow Jamz' Luther Vandross' vertolking van 'A House Is Not a Home' uit 1981." } },
  { track: "Bound 2", artist: "Kanye West", year: 2013,
    answer: "Ponderosa Twins Plus One — \"Bound\"",
    distractors: ["The Spinners — \"I'll Be Around\"","The Stylistics — \"You Are Everything\"","The Delfonics — \"La-La (Means I Love You)\""],
    fact: { en: "Bound 2 prominently samples the Ponderosa Twins Plus One's 1971 soul track Bound.", nl: "Bound 2 samplet prominent de soultrack Bound uit 1971 van de Ponderosa Twins Plus One." } },
  { track: "Otis", artist: "Jay-Z & Kanye West", year: 2011,
    answer: "Otis Redding — \"Try a Little Tenderness\"",
    distractors: ["Otis Redding — \"(Sittin' On) The Dock of the Bay\"","Sam Cooke — \"A Change Is Gonna Come\"","Wilson Pickett — \"In the Midnight Hour\""],
    fact: { en: "Otis chops up Otis Redding's 1966 version of Try a Little Tenderness throughout the track.", nl: "Otis hakt Otis Redding's versie uit 1966 van Try a Little Tenderness door de hele track heen." } },
  { track: "Nice for What", artist: "Drake", year: 2018,
    answer: "Lauryn Hill — \"Ex-Factor\"",
    distractors: ["Erykah Badu — \"On & On\"","Mary J. Blige — \"Be Without You\"","Lauryn Hill — \"Doo Wop (That Thing)\""],
    fact: { en: "Nice for What samples Lauryn Hill's 1998 song Ex-Factor, pitched up over a bounce beat.", nl: "Nice for What samplet Lauryn Hill's nummer Ex-Factor uit 1998, opgepitcht over een bounce beat." } },
  { track: "Old Town Road", artist: "Lil Nas X", year: 2019,
    answer: "Nine Inch Nails — \"34 Ghosts IV\"",
    distractors: ["Massive Attack — \"Teardrop\"","Portishead — \"Glory Box\"","Moby — \"Porcelain\""],
    fact: { en: "The beat is built on a loop from Nine Inch Nails' instrumental 34 Ghosts IV, a $30 beat made by producer YoungKio.", nl: "De beat is gebouwd op een loop uit Nine Inch Nails' instrumental 34 Ghosts IV, een beat van 30 dollar gemaakt door producer YoungKio." } },
  { track: "POWER", artist: "Kanye West", year: 2010,
    answer: "King Crimson — \"21st Century Schizoid Man\"",
    distractors: ["Black Sabbath — \"Iron Man\"","Pink Floyd — \"Money\"","Deep Purple — \"Smoke on the Water\""],
    fact: { en: "POWER lifts the chant from King Crimson's 1969 prog-rock track 21st Century Schizoid Man, which later sparked a lawsuit.", nl: "POWER leent de zang uit King Crimson's prog-rocktrack 21st Century Schizoid Man uit 1969, wat later tot een rechtszaak leidde." } },
  { track: "Without Me", artist: "Eminem", year: 2002,
    answer: "Malcolm McLaren — \"Buffalo Gals\"",
    distractors: ["Grandmaster Flash — \"The Message\"","Afrika Bambaataa — \"Planet Rock\"","Kurtis Blow — \"The Breaks\""],
    fact: { en: "The \"round the outside\" chant in Without Me interpolates Malcolm McLaren's 1982 single Buffalo Gals.", nl: "De \"round the outside\"-zang in Without Me interpoleert Malcolm McLaren's single Buffalo Gals uit 1982." } },
  { track: "SOS", artist: "Rihanna", year: 2006,
    answer: "Soft Cell — \"Tainted Love\"",
    distractors: ["Depeche Mode — \"Just Can't Get Enough\"","Yazoo — \"Don't Go\"","The Human League — \"Don't You Want Me\""],
    fact: { en: "Rihanna's SOS is built around the synth hook of Soft Cell's 1981 hit Tainted Love.", nl: "Rihanna's SOS is gebouwd rond de synthhook van Soft Cell's hit Tainted Love uit 1981." } },
  { track: "Bitter Sweet Symphony", artist: "The Verve", year: 1997,
    answer: "The Rolling Stones — \"The Last Time\"",
    distractors: ["The Beatles — \"Eleanor Rigby\"","The Kinks — \"Waterloo Sunset\"","The Who — \"I Can't Explain\""],
    fact: { en: "Bitter Sweet Symphony uses an orchestral version of the Andrew Loog Oldham Orchestra's cover of the Rolling Stones' The Last Time.", nl: "Bitter Sweet Symphony gebruikt een orkestrale bewerking van een cover van The Rolling Stones' The Last Time." } },
  { track: "Pump It", artist: "The Black Eyed Peas", year: 2005,
    answer: "Dick Dale — \"Misirlou\"",
    distractors: ["The Ventures — \"Walk, Don't Run\"","The Surfaris — \"Wipe Out\"","Link Wray — \"Rumble\""],
    fact: { en: "Pump It is built on the surf-guitar riff of Dick Dale's 1962 recording of Misirlou.", nl: "Pump It is gebouwd op de surfgitaarriff van Dick Dale's opname van Misirlou uit 1962." } },
  { track: "Whatcha Say", artist: "Jason Derulo", year: 2009,
    answer: "Imogen Heap — \"Hide and Seek\"",
    distractors: ["Frou Frou — \"Let Go\"","Dido — \"Thank You\"","Goldfrapp — \"Lovely Head\""],
    fact: { en: "Whatcha Say samples the vocoder hook from Imogen Heap's 2005 song Hide and Seek.", nl: "Whatcha Say sampelt de vocoderhook uit Imogen Heap's nummer Hide and Seek uit 2005." } },
  { track: "One More Time", artist: "Daft Punk", year: 2000,
    answer: "Eddie Johns — \"More Spell on You\"",
    distractors: ["Tavares — \"More Than a Woman\"","George Duke — \"I Want You for Myself\"","Sister Sledge — \"Thinking of You\""],
    fact: { en: "Daft Punk built One More Time around a chopped horn loop from Eddie Johns's 1979 disco track More Spell on You.", nl: "Daft Punk bouwde One More Time rond een versneden blazerssample uit Eddie Johns' discotrack More Spell on You uit 1979." } },
  { track: "Music Sounds Better with You", artist: "Stardust", year: 1998,
    answer: "Chaka Khan — \"Fate\"",
    distractors: ["Sister Sledge — \"Lost in Music\"","Chic — \"I Want Your Love\"","Rufus & Chaka Khan — \"Ain't Nobody\""],
    fact: { en: "Stardust's house anthem loops the guitar riff from Chaka Khan's 1981 song Fate.", nl: "Stardusts house-hit loopt de gitaarriff uit Chaka Khans nummer Fate uit 1981." } },
  { track: "Lady (Hear Me Tonight)", artist: "Modjo", year: 2000,
    answer: "Chic — \"Soup for One\"",
    distractors: ["Chic — \"Good Times\"","Sister Sledge — \"He's the Greatest Dancer\"","Sister Sledge — \"We Are Family\""],
    fact: { en: "Modjo's Lady loops the guitar riff from Chic's 1982 song Soup for One, written by Nile Rodgers and Bernard Edwards.", nl: "Modjo's Lady loopt de gitaarriff uit Chic's nummer Soup for One uit 1982, geschreven door Nile Rodgers en Bernard Edwards." } },
  { track: "Call on Me", artist: "Eric Prydz", year: 2004,
    answer: "Steve Winwood — \"Valerie\"",
    distractors: ["Hall & Oates — \"I Can't Go for That\"","Toto — \"Africa\"","Kool & the Gang — \"Get Down on It\""],
    fact: { en: "Eric Prydz's Call on Me is built on a re-recorded vocal hook from Steve Winwood's 1982 song Valerie.", nl: "Eric Prydz' Call on Me is gebouwd op een opnieuw ingezongen vocale hook uit Steve Winwoods nummer Valerie uit 1982." } },
  { track: "Praise You", artist: "Fatboy Slim", year: 1998,
    answer: "Camille Yarbrough — \"Take Yo' Praise\"",
    distractors: ["Roberta Flack — \"Feel Like Makin' Love\"","Minnie Riperton — \"Lovin' You\"","Bill Withers — \"Grandma's Hands\""],
    fact: { en: "Fatboy Slim's Praise You is built almost entirely on Camille Yarbrough's 1975 soul song Take Yo' Praise.", nl: "Fatboy Slims Praise You is bijna volledig gebouwd op Camille Yarbroughs soulnummer Take Yo' Praise uit 1975." } },
  { track: "Ride on Time", artist: "Black Box", year: 1989,
    answer: "Loleatta Holloway — \"Love Sensation\"",
    distractors: ["First Choice — \"Let No Man Put Asunder\"","Taana Gardner — \"Heartbeat\"","Evelyn King — \"Shame\""],
    fact: { en: "Black Box's Ride on Time lifts its lead vocal from an uncleared sample of Loleatta Holloway's 1980 disco track Love Sensation, which led to a lawsuit.", nl: "Black Box' Ride on Time haalt de leadzang uit een niet-geklaarde sample van Loleatta Holloways discotrack Love Sensation uit 1980, wat tot een rechtszaak leidde." } },
  { track: "I Got U", artist: "Duke Dumont", year: 2014,
    answer: "Whitney Houston — \"My Love Is Your Love\"",
    distractors: ["Robin S. — \"Show Me Love\"","CeCe Peniston — \"Finally\"","Crystal Waters — \"Gypsy Woman\""],
    fact: { en: "Duke Dumont's I Got U interpolates the vocal and melody from Whitney Houston's 1998 song My Love Is Your Love.", nl: "Duke Dumonts I Got U interpoleert de zang en melodie uit Whitney Houstons nummer My Love Is Your Love uit 1998." } },
  { track: "Uptown Funk", artist: "Mark Ronson", year: 2014,
    answer: "The Gap Band — \"Oops Upside Your Head\"",
    distractors: ["Cameo — \"Candy\"","Rick James — \"Give It to Me Baby\"","Roger Troutman — \"I Want to Be Your Man\""],
    fact: { en: "After a dispute, the Gap Band were added to the writing credits of Uptown Funk for similarities to their 1979 song Oops Upside Your Head.", nl: "Na een geschil werd de Gap Band toegevoegd aan de schrijfcredits van Uptown Funk vanwege gelijkenissen met hun nummer Oops Upside Your Head uit 1979." } },
  { track: "Without Me", artist: "Halsey", year: 2018,
    answer: "Justin Timberlake — \"Cry Me a River\"",
    distractors: ["Usher — \"U Got It Bad\"","Ne-Yo — \"So Sick\"","Chris Brown — \"With You\""],
    fact: { en: "Halsey's Without Me interpolates the pre-chorus of Justin Timberlake's Cry Me a River, with Timberlake, Timbaland and Scott Storch credited.", nl: "Halsey's Without Me interpoleert de pre-chorus van Justin Timberlake's Cry Me a River, met Timberlake, Timbaland en Scott Storch gecrediteerd." } },
  { track: "Glory Box", artist: "Portishead", year: 1994,
    answer: "Isaac Hayes — \"Ike's Rap II\"",
    distractors: ["Isaac Hayes — \"Theme from Shaft\"","Curtis Mayfield — \"Move On Up\"","Marvin Gaye — \"Inner City Blues\""],
    fact: { en: "The hypnotic string and bass loop is sampled from Isaac Hayes's Ike's Rap II off his 1971 album Black Moses.", nl: "De hypnotische strijkers- en basloop is gesampled van Ike's Rap II van Isaac Hayes, van het album Black Moses uit 1971." } },
  { track: "Safe from Harm", artist: "Massive Attack", year: 1991,
    answer: "Billy Cobham — \"Stratus\"",
    distractors: ["Herbie Hancock — \"Chameleon\"","Weather Report — \"Birdland\"","Lonnie Liston Smith — \"Expansions\""],
    fact: { en: "The bassline and drums are sampled from Billy Cobham's Stratus, off his 1973 jazz-fusion album Spectrum.", nl: "De baslijn en drums zijn gesampled van Stratus van Billy Cobham, van zijn jazzfusion-album Spectrum uit 1973." } },
  { track: "My Name Is", artist: "Eminem", year: 1999,
    answer: "Labi Siffre — \"I Got The...\"",
    distractors: ["Bill Withers — \"Use Me\"","Gil Scott-Heron — \"The Bottle\"","Terry Callier — \"Ordinary Joe\""],
    fact: { en: "The bass and electric-piano riff is sampled from Labi Siffre's 1975 song I Got The...", nl: "De bas- en elektrische-pianoriff is gesampled van het nummer I Got The... van Labi Siffre uit 1975." } },
  { track: "Uptown Funk", artist: "Mark Ronson ft. Bruno Mars", year: 2014,
    answer: "The Gap Band — \"Oops Upside Your Head\"",
    distractors: ["Cameo — \"Word Up!\"","Zapp — \"More Bounce to the Ounce\"","Rick James — \"Give It to Me Baby\""],
    fact: { en: "After a legal claim, members of The Gap Band were added to the songwriting credits over similarities to their 1979 funk hit.", nl: "Na een juridische claim kregen leden van The Gap Band schrijverscredits vanwege gelijkenis met hun funkhit uit 1979." } },
  { track: "Ghetto Gospel", artist: "2Pac ft. Elton John", year: 2005,
    answer: "Elton John — \"Indian Sunset\"",
    distractors: ["Elton John — \"Tiny Dancer\"","Elton John — \"Rocket Man\"","Elton John — \"Mona Lisas and Mad Hatters\""],
    fact: { en: "The track samples Elton John's 1971 song Indian Sunset for its chorus melody and vocals.", nl: "Het nummer sampelt Elton John's nummer Indian Sunset uit 1971 voor de refreinmelodie en zang." } },
  { track: "Touch the Sky", artist: "Kanye West", year: 2005,
    answer: "Curtis Mayfield — \"Move On Up\"",
    distractors: ["Curtis Mayfield — \"Superfly\"","The Impressions — \"People Get Ready\"","Donny Hathaway — \"The Ghetto\""],
    fact: { en: "Just Blaze produced Touch the Sky by sampling the triumphant horns of Curtis Mayfield's 1971 song Move On Up.", nl: "Just Blaze produceerde Touch the Sky door de triomfantelijke blazers uit Curtis Mayfields Move On Up uit 1971 te samplen." } },
  { track: "One More Chance (Remix)", artist: "The Notorious B.I.G.", year: 1995,
    answer: "DeBarge — \"Stay with Me\"",
    distractors: ["The Jackson 5 — \"I Wanna Be Where You Are\"","The Sylvers — \"Misdemeanor\"","Switch — \"There'll Never Be\""],
    fact: { en: "The One More Chance remix loops the smooth keyboard intro of DeBarge's 1983 song Stay with Me.", nl: "De One More Chance-remix loopt de zachte keyboardintro van DeBarge's nummer Stay with Me uit 1983." } },
  { track: "It's Like That", artist: "Run-DMC vs Jason Nevins", year: 1997,
    answer: "Run-DMC — \"It's Like That\"",
    distractors: ["The Sugarhill Gang — \"Rapper's Delight\"","Grandmaster Flash — \"The Message\"","Kurtis Blow — \"The Breaks\""],
    fact: { en: "Jason Nevins remixed Run-DMC's 1983 debut single It's Like That into a global club and chart smash in 1997.", nl: "Jason Nevins remixte Run-DMC's debuutsingle It's Like That uit 1983 in 1997 tot een wereldwijde clubhit." } },
  { track: "Cotton Eye Joe", artist: "Rednex", year: 1994,
    answer: "Rednex — \"Cotton Eye Joe\"",
    distractors: ["The Charlie Daniels Band — \"The Devil Went Down to Georgia\"","Alabama — \"Mountain Music\"","The Nitty Gritty Dirt Band — \"Fishin' in the Dark\""],
    fact: { en: "Rednex built their Eurodance smash on Cotton-Eyed Joe, a traditional American folk fiddle tune that dates back to before the 20th century.", nl: "Rednex bouwde hun eurodance-hit op Cotton-Eyed Joe, een traditioneel Amerikaans folk-fiddledeuntje dat teruggaat tot voor de 20e eeuw." } },
  { track: "Macarena (Bayside Boys Mix)", artist: "Los Del Rio", year: 1995,
    answer: "Los Del Rio — \"Macarena\"",
    distractors: ["Gipsy Kings — \"Bamboleo\"","Las Ketchup — \"Aserejé\"","Chayanne — \"Provocame\""],
    fact: { en: "The chart-topping English remix is a reworking of the Spanish duo Los Del Rio's original 1993 Macarena.", nl: "De Engelse remix die nummer een werd, is een bewerking van het originele Macarena uit 1993 van Los Del Rio." } },
  { track: "Numa Numa (Dragostea Din Tei)", artist: "O-Zone", year: 2003,
    answer: "O-Zone — \"Dragostea Din Tei\"",
    distractors: ["Haddaway — \"What Is Love\"","Eiffel 65 — \"Blue (Da Ba Dee)\"","Aqua — \"Barbie Girl\""],
    fact: { en: "The viral Numa Numa hit is the Moldovan group O-Zone's original Romanian-language song Dragostea Din Tei.", nl: "De virale Numa Numa-hit is het originele Roemeenstalige Dragostea Din Tei van de Moldavische groep O-Zone." } },
  { track: "Who Let the Dogs Out", artist: "Baha Men", year: 2000,
    answer: "Anslem Douglas — \"Who Let the Dogs Out\"",
    distractors: ["Arrow — \"Hot Hot Hot\"","Byron Lee — \"Soca Tatie\"","The Mighty Sparrow — \"Jean and Dinah\""],
    fact: { en: "The Baha Men's hit is a cover of Trinidadian artist Anslem Douglas's 1998 soca song Who Let the Dogs Out.", nl: "De hit van de Baha Men is een cover van het soca-nummer Who Let the Dogs Out uit 1998 van de Trinidadiaan Anslem Douglas." } },
  { track: "The Ketchup Song (Aserejé)", artist: "Las Ketchup", year: 2002,
    answer: "The Sugarhill Gang — \"Rapper's Delight\"",
    distractors: ["Grandmaster Flash — \"The Message\"","Kurtis Blow — \"The Breaks\"","Afrika Bambaataa — \"Planet Rock\""],
    fact: { en: "The nonsense chorus of Aserejé is a phonetic Spanish mangling of the opening line of Rapper's Delight by The Sugarhill Gang.", nl: "Het nonsens-refrein van Aserejé is een fonetische Spaanse verbastering van de openingsregel van Rapper's Delight van The Sugarhill Gang." } },
  { track: "Get Busy", artist: "Sean Paul", year: 2003,
    answer: "Lenky — \"Diwali Riddim\"",
    distractors: ["Dave Kelly — \"Bug Riddim\"","Tony Kelly — \"Bookshelf Riddim\"","Jeremy Harding — \"Playground Riddim\""],
    fact: { en: "Sean Paul's number one hit Get Busy was built on the Diwali Riddim, the hand-clap dancehall beat produced by Steven 'Lenky' Marsden in 2002.", nl: "Sean Pauls nummer een hit Get Busy is gebouwd op de Diwali Riddim, de hand-klap dancehall beat van Lenky uit 2002." } },
  { track: "No Letting Go", artist: "Wayne Wonder", year: 2002,
    answer: "Lenky — \"Diwali Riddim\"",
    distractors: ["Sly & Robbie — \"Murder She Wrote Riddim\"","Dave Kelly — \"Showtime Riddim\"","Steely & Clevie — \"Street Sweeper Riddim\""],
    fact: { en: "Wayne Wonder's crossover hit No Letting Go rides the same Diwali Riddim that powered Sean Paul's Get Busy.", nl: "Wayne Wonder's hit No Letting Go gebruikt dezelfde Diwali Riddim als Sean Paul's Get Busy." } },
  { track: "Angel", artist: "Shaggy", year: 2001,
    answer: "Steve Miller Band — \"The Joker\"",
    distractors: ["Eddy Grant — \"Electric Avenue\"","UB40 — \"Red Red Wine\"","Bill Withers — \"Lean on Me\""],
    fact: { en: "Shaggy's Angel samples the bassline of the Steve Miller Band's The Joker and interpolates the chorus of Angel of the Morning.", nl: "Shaggy's Angel samplet de baslijn van Steve Miller Band's The Joker en leent het refrein van Angel of the Morning." } },
  { track: "Bonita Applebum", artist: "A Tribe Called Quest", year: 1990,
    answer: "RAMP — \"Daylight\"",
    distractors: ["Roy Ayers — \"Everybody Loves the Sunshine\"","Lonnie Liston Smith — \"Expansions\"","Bobbi Humphrey — \"Harlem River Drive\""],
    fact: { en: "The main loop is taken from RAMP's 1977 Roy Ayers production Daylight.", nl: "De hoofdloop komt uit RAMP's Daylight uit 1977, geproduceerd door Roy Ayers." } },
  { track: "Electric Relaxation", artist: "A Tribe Called Quest", year: 1993,
    answer: "Ronnie Foster — \"Mystic Brew\"",
    distractors: ["Grover Washington Jr. — \"Mister Magic\"","Bob James — \"Take Me to the Mardi Gras\"","Eddie Henderson — \"Inside You\""],
    fact: { en: "The hazy loop comes from organist Ronnie Foster's 1972 Mystic Brew.", nl: "De wazige loop komt uit Mystic Brew van organist Ronnie Foster uit 1972." } },
  { track: "Passin' Me By", artist: "The Pharcyde", year: 1992,
    answer: "Quincy Jones — \"Summer in the City\"",
    distractors: ["Roy Ayers — \"We Live in Brooklyn, Baby\"","Donald Byrd — \"Think Twice\"","Weldon Irvine — \"We Gettin' Down\""],
    fact: { en: "The signature loop is lifted from Quincy Jones' 1973 cover Summer in the City.", nl: "De kenmerkende loop komt uit Quincy Jones' cover Summer in the City uit 1973." } },
  { track: "93 'til Infinity", artist: "Souls of Mischief", year: 1993,
    answer: "Billy Cobham — \"Heather\"",
    distractors: ["Herbie Hancock — \"Watermelon Man\"","Freddie Hubbard — \"Red Clay\"","Lonnie Liston Smith — \"A Chance for Peace\""],
    fact: { en: "The mellow backing samples drummer Billy Cobham's 1974 jazz-fusion piece Heather.", nl: "De zachte backing samplet Heather van drummer Billy Cobham uit 1974." } },
  { track: "Rebirth of Slick (Cool Like Dat)", artist: "Digable Planets", year: 1993,
    answer: "Art Blakey — \"Stretching\"",
    distractors: ["Herbie Hancock — \"Cantaloupe Island\"","Lou Donaldson — \"Ode to Billie Joe\"","Grant Green — \"Sookie Sookie\""],
    fact: { en: "The horn loop is taken from Art Blakey and the Jazz Messengers' Stretching.", nl: "De blazersloop komt uit Stretching van Art Blakey and the Jazz Messengers." } },
  { track: "Check the Rhime", artist: "A Tribe Called Quest", year: 1991,
    answer: "Average White Band — \"Love Your Life\"",
    distractors: ["Kool & the Gang — \"Hollywood Swinging\"","The Crusaders — \"Way Back Home\"","Tower of Power — \"What Is Hip?\""],
    fact: { en: "The horn stabs are sampled from Average White Band's 1976 Love Your Life.", nl: "De blazersstoten zijn gesamplet uit Average White Bands Love Your Life uit 1976." } },
  { track: "Mass Appeal", artist: "Gang Starr", year: 1994,
    answer: "Vic Juris — \"Horizon Drive\"",
    distractors: ["George Benson — \"Breezin'\"","Eric Gale — \"Forecast\"","Earl Klugh — \"Living Inside Your Love\""],
    fact: { en: "DJ Premier built the hook around guitarist Vic Juris's 1979 Horizon Drive.", nl: "DJ Premier bouwde de hook rond gitarist Vic Juris' Horizon Drive uit 1979." } },
  { track: "Ms. Jackson", artist: "OutKast", year: 2000,
    answer: "The Brothers Johnson — \"Strawberry Letter 23\"",
    distractors: ["The Isley Brothers — \"Between the Sheets\"","The Gap Band — \"Outstanding\"","Roy Ayers — \"Everybody Loves the Sunshine\""],
    fact: { en: "OutKast's 'Ms. Jackson' uses a reversed, pitch-shifted sample of The Brothers Johnson's 1977 'Strawberry Letter 23', itself a cover of Shuggie Otis.", nl: "OutKasts 'Ms. Jackson' gebruikt een omgekeerde, in toonhoogte verschoven sample van The Brothers Johnsons 'Strawberry Letter 23' uit 1977, zelf een cover van Shuggie Otis." } },
  { track: "Big Pimpin'", artist: "Jay-Z", year: 1999,
    answer: "Abdel Halim Hafez — \"Khosara Khosara\"",
    distractors: ["Umm Kulthum — \"Enta Omri\"","Mohammed Abdel Wahab — \"Cleopatra\"","Farid al-Atrash — \"Habina\""],
    fact: { en: "Timbaland built 'Big Pimpin'' around the flute melody from Abdel Halim Hafez's Egyptian song 'Khosara Khosara', later the subject of a copyright lawsuit.", nl: "Timbaland bouwde 'Big Pimpin'' rond de fluitmelodie uit Abdel Halim Hafez' Egyptische lied 'Khosara Khosara', later onderwerp van een rechtszaak." } },
  { track: "Hate It or Love It", artist: "The Game", year: 2005,
    answer: "The Trammps — \"Rubber Band\"",
    distractors: ["MFSB — \"Love Is the Message\"","The O'Jays — \"For the Love of Money\"","Harold Melvin & the Blue Notes — \"The Love I Lost\""],
    fact: { en: "The Game and 50 Cent's 'Hate It or Love It', produced by Cool & Dre, is built on a sample of The Trammps' 1975 Philly soul track 'Rubber Band'.", nl: "The Game en 50 Cents 'Hate It or Love It', geproduceerd door Cool & Dre, is gebouwd op een sample van The Trammps' Philly-soulnummer 'Rubber Band' uit 1975." } },
  { track: "Crazy", artist: "Gnarls Barkley", year: 2006,
    answer: "Gian Franco Reverberi — \"Nel Cimitero di Tucson\"",
    distractors: ["Ennio Morricone — \"The Ecstasy of Gold\"","Nino Rota — \"The Godfather Waltz\"","Riz Ortolani — \"Cannibal Holocaust\""],
    fact: { en: "Gnarls Barkley's 'Crazy' is based on 'Nel Cimitero di Tucson' from the Reverberi brothers' score for the 1968 spaghetti western 'Django, Prepare a Coffin'.", nl: "Gnarls Barkley's 'Crazy' is gebaseerd op 'Nel Cimitero di Tucson' uit de filmmuziek van de gebroeders Reverberi voor de spaghettiwestern 'Django, Prepare a Coffin' uit 1968." } },
  { track: "Ms. Fat Booty", artist: "Mos Def", year: 1999,
    answer: "Aretha Franklin — \"One Step Ahead\"",
    distractors: ["Aretha Franklin — \"Rock Steady\"","Aretha Franklin — \"Day Dreaming\"","Roberta Flack — \"Feel Like Makin' Love\""],
    fact: { en: "Produced by Ayatollah, Mos Def's 'Ms. Fat Booty' samples Aretha Franklin's 1965 recording 'One Step Ahead' for its vocal hook and strings.", nl: "Geproduceerd door Ayatollah, sampelt Mos Defs 'Ms. Fat Booty' Aretha Franklins opname 'One Step Ahead' uit 1965 voor de vocale hook en strijkers." } },
  { track: "Encore", artist: "Jay-Z", year: 2003,
    answer: "John Holt — \"I Will\"",
    distractors: ["Toots and the Maytals — \"Pressure Drop\"","Bob Marley — \"Stir It Up\"","Ken Boothe — \"Everything I Own\""],
    fact: { en: "Kanye West built Jay-Z's 'Encore' on a sped-up sample of Jamaican singer John Holt's reggae cover of The Beatles' 'I Will'.", nl: "Kanye West bouwde Jay-Z's 'Encore' op een versnelde sample van de reggaecover van The Beatles' 'I Will' door de Jamaicaanse zanger John Holt." } },
  { track: "99 Problems", artist: "Jay-Z", year: 2003,
    answer: "Billy Squier — \"The Big Beat\"",
    distractors: ["Phil Collins — \"In the Air Tonight\"","Led Zeppelin — \"When the Levee Breaks\"","The Winstons — \"Amen, Brother\""],
    fact: { en: "Rick Rubin built Jay-Z's '99 Problems' around the drum break from Billy Squier's 1980 rock track 'The Big Beat'.", nl: "Rick Rubin bouwde Jay-Z's '99 Problems' rond de drumbreak van Billy Squiers rocknummer 'The Big Beat' uit 1980." } },
  { track: "N***as in Paris", artist: "Jay-Z & Kanye West", year: 2011,
    answer: "Reverend W.A. Donaldson — \"Baptizing Scene\"",
    distractors: ["The Honey Drippers — \"Impeach the President\"","Lyn Collins — \"Think (About It)\"","Bobby Byrd — \"I Know You Got Soul\""],
    fact: { en: "Hit-Boy's beat buries a looped vocal shout from Reverend W.A. Donaldson's Baptizing Scene under the production.", nl: "Hit-Boy's beat verstopt een gelooptde vocale shout uit Reverend W.A. Donaldson's Baptizing Scene onder de productie." } },
  { track: "Sicko Mode", artist: "Travis Scott", year: 2018,
    answer: "Notorious B.I.G. — \"Gimme the Loot\"",
    distractors: ["Notorious B.I.G. — \"Hypnotize\"","Nas — \"N.Y. State of Mind\"","Mobb Deep — \"Shook Ones, Pt. II\""],
    fact: { en: "Sicko Mode drops in Notorious B.I.G.'s voice from Gimme the Loot, a 1994 track, earning Biggie a writing credit.", nl: "Sicko Mode gooit Notorious B.I.G.'s stem uit Gimme the Loot, een track uit 1994, erin, wat Biggie een schrijverscredit oplevert." } },
  { track: "Pound Cake / Paris Morton Music 2", artist: "Drake", year: 2013,
    answer: "Ellie Goulding — \"Don't Say a Word\"",
    distractors: ["Jamie xx — \"Far Nearer\"","The xx — \"Intro\"","Imogen Heap — \"Hide and Seek\""],
    fact: { en: "The opening of Pound Cake samples Ellie Goulding's 2012 song Don't Say a Word, alongside a Wu-Tang vocal.", nl: "De opening van Pound Cake samplet Ellie Goulding's nummer Don't Say a Word uit 2012, naast een Wu-Tang vocal." } },
  { track: "Truffle Butter", artist: "Nicki Minaj", year: 2014,
    answer: "Maya Jane Coles — \"What They Say\"",
    distractors: ["Disclosure — \"Latch\"","Robin S. — \"Show Me Love\"","Crystal Waters — \"Gypsy Woman\""],
    fact: { en: "Truffle Butter is built over a slowed flip of Maya Jane Coles' 2010 deep house track What They Say.", nl: "Truffle Butter is gebouwd over een vertraagde flip van Maya Jane Coles' deep house track What They Say uit 2010." } },
  { track: "Mask Off", artist: "Future", year: 2017,
    answer: "Tommy Butler — \"Prison Song\"",
    distractors: ["Curtis Mayfield — \"Pusherman\"","Gil Scott-Heron — \"The Bottle\"","Marvin Gaye — \"Inner City Blues\""],
    fact: { en: "Metro Boomin sampled the flute melody from Tommy Butler's Prison Song, performed by Carlton Williams, for Mask Off.", nl: "Metro Boomin samplede de fluitmelodie uit Tommy Butler's Prison Song, uitgevoerd door Carlton Williams, voor Mask Off." } },
  { track: "Ghost Town", artist: "Kanye West", year: 2018,
    answer: "Shirley Ann Lee — \"Someday\"",
    distractors: ["Mahalia Jackson — \"How I Got Over\"","The Staple Singers — \"I'll Take You There\"","Sister Rosetta Tharpe — \"Up Above My Head\""],
    fact: { en: "Ghost Town's intro samples the gospel recording Someday by Shirley Ann Lee.", nl: "De intro van Ghost Town sampelt de gospelopname Someday van Shirley Ann Lee." } },
  { track: "Aerodynamic", artist: "Daft Punk", year: 2001,
    answer: "Sister Sledge — \"Il Macquillage Lady\"",
    distractors: ["Chic — \"Le Freak\"","Sister Sledge — \"Lost in Music\"","The Whispers — \"And the Beat Goes On\""],
    fact: { en: "The main riff of Daft Punk's Aerodynamic samples Sister Sledge's 1979 track Il Macquillage Lady.", nl: "De hoofdriff van Daft Punks Aerodynamic sampelt Sister Sledge's nummer Il Macquillage Lady uit 1979." } },
  { track: "You Don't Know Me", artist: "Armand Van Helden", year: 1999,
    answer: "Carrie Lucas — \"Dance with You\"",
    distractors: ["Chic — \"I Want Your Love\"","Sister Sledge — \"Lost in Music\"","Evelyn King — \"Shame\""],
    fact: { en: "Armand Van Helden's You Don't Know Me samples the strings from Carrie Lucas's 1979 disco track Dance with You.", nl: "Armand Van Heldens You Don't Know Me sampelt de strijkers uit Carrie Lucas' discotrack Dance with You uit 1979." } },
  { track: "Don't You Want Me", artist: "Felix", year: 1992,
    answer: "Jomanda — \"Don't You Want My Love\"",
    distractors: ["First Choice — \"Let No Man Put Asunder\"","Loleatta Holloway — \"Love Sensation\"","Sylvester — \"You Make Me Feel (Mighty Real)\""],
    fact: { en: "Felix's 1992 rave hit Don't You Want Me samples the vocal from Jomanda's 1991 garage track Don't You Want My Love.", nl: "Felix' ravehit Don't You Want Me uit 1992 sampelt de zang uit Jomanda's garagetrack Don't You Want My Love uit 1991." } },
  { track: "Ghetto Gospel", artist: "2Pac", year: 2005,
    answer: "Elton John — \"Indian Sunset\"",
    distractors: ["Elton John — \"Rocket Man\"","Phil Collins — \"In the Air Tonight\"","Bill Withers — \"Ain't No Sunshine\""],
    fact: { en: "The posthumous 2Pac single Ghetto Gospel, produced by Eminem, samples Elton John's 1971 song Indian Sunset, with John credited as a featured artist.", nl: "De postume 2Pac-single Ghetto Gospel, geproduceerd door Eminem, samplet Elton John's nummer Indian Sunset uit 1971, met John gecrediteerd als gastartiest." } },
  { track: "Harder, Better, Faster, Stronger", artist: "Daft Punk", year: 2001,
    answer: "Edwin Birdsong — \"Cola Bottle Baby\"",
    distractors: ["Chic — \"Good Times\"","Sister Sledge — \"We Are Family\"","Vaughan Mason & Crew — \"Bounce, Rock, Skate, Roll\""],
    fact: { en: "Daft Punk's Harder, Better, Faster, Stronger samples the keyboard riff from Edwin Birdsong's 1979 funk track Cola Bottle Baby.", nl: "Daft Punk's Harder, Better, Faster, Stronger samplet de keyboardriff uit Edwin Birdsong's funktrack Cola Bottle Baby uit 1979." } },
  { track: "Clint Eastwood", artist: "Gorillaz", year: 2001,
    answer: "Suzuki — \"Omnichord OM-300 Rock 1\"",
    distractors: ["Kraftwerk — \"Trans-Europe Express\"","Yellow Magic Orchestra — \"Computer Game\"","Tangerine Dream — \"Love on a Real Train\""],
    fact: { en: "The melodica and drum groove come from the Rock 1 preset of the Suzuki Omnichord OM-300, as Damon Albarn later revealed.", nl: "De melodica en de drumgroove komen van de Rock 1-preset van de Suzuki Omnichord OM-300, zoals Damon Albarn later onthulde." } },
  { track: "Loser", artist: "Beck", year: 1993,
    answer: "Johnny Jenkins — \"I Walk on Guilded Splinters\"",
    distractors: ["Dr. John — \"Right Place Wrong Time\"","The Meters — \"Cissy Strut\"","Tony Joe White — \"Polk Salad Annie\""],
    fact: { en: "The drum break is lifted from Johnny Jenkins's 1970 cover of Dr. John's I Walk on Guilded Splinters.", nl: "De drumbreak komt van de cover uit 1970 van Johnny Jenkins van Dr. John's I Walk on Guilded Splinters." } },
  { track: "The Rockafeller Skank", artist: "Fatboy Slim", year: 1998,
    answer: "The Just Brothers — \"Sliced Tomatoes\"",
    distractors: ["Dick Dale — \"Misirlou\"","The Surfaris — \"Wipe Out\"","Link Wray — \"Rumble\""],
    fact: { en: "The surf-guitar riff and beat are built around The Just Brothers' 1972 instrumental Sliced Tomatoes.", nl: "De surfgitaarriff en beat zijn gebouwd rond het instrumentale Sliced Tomatoes van The Just Brothers uit 1972." } },
  { track: "Loaded", artist: "Primal Scream", year: 1990,
    answer: "The Wild Angels — \"Loaded\"",
    distractors: ["The Seeds — \"Pushin' Too Hard\"","Steppenwolf — \"Born to Be Wild\"","The Trip — \"Spoonful\""],
    fact: { en: "The spoken intro is Peter Fonda's dialogue sampled from the 1966 biker film The Wild Angels.", nl: "De gesproken intro is dialoog van Peter Fonda, gesampled uit de bikerfilm The Wild Angels uit 1966." } },
  { track: "Honey", artist: "Moby", year: 1998,
    answer: "Bessie Jones — \"Sometimes\"",
    distractors: ["Vera Hall — \"Trouble So Hard\"","Mississippi Fred McDowell — \"You Gotta Move\"","Lead Belly — \"Goodnight Irene\""],
    fact: { en: "The looped vocal is from an Alan Lomax field recording of Bessie Jones singing Sometimes, made around 1959 to 1960.", nl: "De geloopte vocaal komt uit een veldopname van Alan Lomax waarop Bessie Jones Sometimes zingt, gemaakt rond 1959 tot 1960." } },
  { track: "Since I Left You", artist: "The Avalanches", year: 2000,
    answer: "The Main Attraction — \"Everyday\"",
    distractors: ["The Fifth Dimension — \"Up, Up and Away\"","The Free Design — \"Kites Are Fun\"","Rotary Connection — \"Memory Band\""],
    fact: { en: "The title hook is a rearranged vocal sample of The Main Attraction's 1968 song Everyday.", nl: "De titelhook is een herschikte vocale sample van het nummer Everyday van The Main Attraction uit 1968." } },
  { track: "Million Dollar Bill", artist: "Whitney Houston", year: 2009,
    answer: "Loleatta Holloway — \"We're Getting Stronger (The Longer We Stay Together)\"",
    distractors: ["Loleatta Holloway — \"Hit and Run\"","First Choice — \"Let No Man Put Asunder\"","Double Exposure — \"Ten Percent\""],
    fact: { en: "Million Dollar Bill samples Loleatta Holloway's 1977 disco track We're Getting Stronger, with production by Swizz Beatz and Alicia Keys.", nl: "Million Dollar Bill sampelt Loleatta Holloway's discotrack We're Getting Stronger uit 1977, geproduceerd door Swizz Beatz en Alicia Keys." } },
  { track: "I'll House You", artist: "Jungle Brothers", year: 1988,
    answer: "Royal House — \"Can You Party\"",
    distractors: ["MFSB — \"Love Is the Message\"","First Choice — \"Let No Man Put Asunder\"","Loleatta Holloway — \"Love Sensation\""],
    fact: { en: "I'll House You is built directly over Royal House's 1988 house track Can You Party, produced by Todd Terry.", nl: "I'll House You is gebouwd op Royal House's housetrack Can You Party uit 1988, geproduceerd door Todd Terry." } },
  { track: "Slow Jamz", artist: "Twista ft. Kanye West & Jamie Foxx", year: 2003,
    answer: "Luther Vandross — \"A House Is Not a Home\"",
    distractors: ["Marvin Gaye — \"Distant Lover\"","Teddy Pendergrass — \"Love T.K.O.\"","Smokey Robinson — \"Cruisin'\""],
    fact: { en: "The song interpolates and samples Luther Vandross's 1981 rendition of A House Is Not a Home.", nl: "Het nummer interpoleert en sampelt Luther Vandross's vertolking van A House Is Not a Home uit 1981." } },
  { track: "It's All About the Benjamins", artist: "Puff Daddy", year: 1997,
    answer: "Love Unlimited — \"I Did It for Love\"",
    distractors: ["Barry White — \"Love's Theme\"","MFSB — \"Love Is the Message\"","The O'Jays — \"For the Love of Money\""],
    fact: { en: "The Benjamins instrumental loops a guitar lick from I Did It for Love by Love Unlimited, the soul trio Barry White wrote and produced for.", nl: "Het Benjamins-instrumentaal loopt een gitaarriff uit I Did It for Love van Love Unlimited, het soultrio waarvoor Barry White schreef en produceerde." } },
  { track: "Hey Mama", artist: "Kanye West", year: 2005,
    answer: "Donal Leace — \"Today Won't Come Again\"",
    distractors: ["Bill Withers — \"Grandma's Hands\"","Donny Hathaway — \"Someday We'll All Be Free\"","Roberta Flack — \"Compared to What\""],
    fact: { en: "Kanye West built Hey Mama around the looped la-la vocals from Donal Leace's 1972 folk-soul song Today Won't Come Again.", nl: "Kanye West bouwde Hey Mama rond de geloopte la-la-vocalen uit Donal Leace's folk-soulnummer Today Won't Come Again uit 1972." } },
  { track: "Pump Up the Jam", artist: "Technotronic", year: 1989,
    answer: "Technotronic — \"Pump Up the Jam\"",
    distractors: ["Black Box — \"Ride on Time\"","Snap! — \"The Power\"","C+C Music Factory — \"Gonna Make You Sweat\""],
    fact: { en: "Pump Up the Jam is an original house track and one of the first to break the genre into the mainstream pop charts.", nl: "Pump Up the Jam is een originele housetrack en brak als een van de eerste door naar de poplijsten." } },
]

const LEVEL_SIZE = 14 // questions per level
const LEVEL_COUNT = Math.max(1, Math.floor(QUESTIONS.length / LEVEL_SIZE))
const CLEAR = 10 // score (out of 14) needed to clear a level and unlock the next
const SESSION_TTL = 30 * 60_000 // a game in progress lives 30 min
const MAX_SESSIONS = 5000 // safety cap on the in-memory store

// 1-based level -> the 14 question indices that make it up. Level membership is
// stable: level 1 is the first 14 in QUESTIONS, level 2 the next 14, and so on.
const levelIndices = (level) =>
  Array.from({ length: LEVEL_SIZE }, (_, j) => (level - 1) * LEVEL_SIZE + j)

function shuffle(a) {
  const r = a.slice()
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}

// Monday-anchored UTC week bucket. The board resets every Monday 00:00 UTC so
// the top is never frozen by whoever first hit a perfect 14 — everyone gets a
// fresh shot each week and a reason to come back. `id` is the ISO date of that
// week's Monday; `endsAt` is next Monday (when the board rolls over).
function weekBounds(ts = Date.now()) {
  const d = new Date(ts)
  const dow = (d.getUTCDay() + 6) % 7 // Mon = 0 … Sun = 6
  const monday = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - dow)
  const nextMonday = monday + 7 * 24 * 60 * 60 * 1000
  return { id: new Date(monday).toISOString().slice(0, 10), endsAt: nextMonday }
}

export function mountGame(app, { db, ok, fail, rateLimit, langOf }) {
  // All-time best per user — kept as a harmless permanent record (history), but
  // the public board reads the WEEKLY table below, not this one.
  db.exec(`CREATE TABLE IF NOT EXISTS game_scores (
    userId TEXT PRIMARY KEY,
    best INTEGER NOT NULL DEFAULT 0,
    bestStreak INTEGER NOT NULL DEFAULT 0,
    bestAt INTEGER,
    plays INTEGER NOT NULL DEFAULT 0,
    updatedAt INTEGER
  )`)

  // Weekly board: one row per (week, user). best within that week; bestAt = when
  // it was first hit (earliest-wins tie-break, the SMPL stance). A new week =
  // new rows = a clean leaderboard.
  db.exec(`CREATE TABLE IF NOT EXISTS game_week_scores (
    weekId TEXT,
    userId TEXT,
    best INTEGER NOT NULL DEFAULT 0,
    bestStreak INTEGER NOT NULL DEFAULT 0,
    bestAt INTEGER,
    plays INTEGER NOT NULL DEFAULT 0,
    updatedAt INTEGER,
    PRIMARY KEY (weekId, userId)
  )`)
  db.exec('CREATE INDEX IF NOT EXISTS idx_week_scores ON game_week_scores (weekId, best DESC, bestAt ASC)')

  // Per-level progression: one row per (user, level). A level is `cleared` once
  // bestScore >= CLEAR, which unlocks the next. The LEAGUE ranks by levels
  // cleared, then total points (sum of best scores), then who got there first.
  db.exec(`CREATE TABLE IF NOT EXISTS game_progress (
    userId TEXT,
    level INTEGER,
    bestScore INTEGER NOT NULL DEFAULT 0,
    bestStreak INTEGER NOT NULL DEFAULT 0,
    cleared INTEGER NOT NULL DEFAULT 0,
    clearedAt INTEGER,
    plays INTEGER NOT NULL DEFAULT 0,
    updatedAt INTEGER,
    PRIMARY KEY (userId, level)
  )`)
  db.exec('CREATE INDEX IF NOT EXISTS idx_progress_user ON game_progress (userId)')

  // highest level a member may play = 1 + their highest cleared level (capped).
  const unlockedThrough = (userId) => {
    const row = db.prepare('SELECT MAX(level) AS m FROM game_progress WHERE userId = ? AND cleared = 1').get(userId)
    return Math.min(LEVEL_COUNT, (row?.m || 0) + 1)
  }

  // sid -> { order:[qIdx], opts:[[strings]], correct:[idx], answered:[bool],
  //          score, streak, best, createdAt, finalized }
  const sessions = new Map()

  function prune() {
    const cutoff = Date.now() - SESSION_TTL
    for (const [sid, s] of sessions) if (s.createdAt < cutoff) sessions.delete(sid)
    // hard cap: if we somehow blow past the limit, drop the oldest sessions
    if (sessions.size > MAX_SESSIONS) {
      const sorted = [...sessions.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt)
      for (let i = 0; i < sorted.length - MAX_SESSIONS; i++) sessions.delete(sorted[i][0])
    }
  }

  const newSid = () => 'g_' + Math.random().toString(36).slice(2) + Date.now().toString(36)

  // ---- start a round: build a fresh, shuffled, answer-stripped question set ----
  app.post('/api/game/start', rateLimit('gameStart', 40, 10 * 60_000), (req, res) => {
    prune()
    let level = Math.floor(Number(req.body?.level) || 1)
    if (!Number.isFinite(level) || level < 1) level = 1
    if (level > LEVEL_COUNT) level = LEVEL_COUNT
    // unlock gate: a signed-in member may play up to their unlocked level; a
    // guest (no progression) gets level 1 only and is nudged to sign in.
    const unlocked = req.user ? unlockedThrough(req.user.id) : 1
    if (level > unlocked) return fail(res, 403, 'Clear the earlier levels first.')

    const order = shuffle(levelIndices(level))
    const opts = [],
      correct = []
    for (const qi of order) {
      const q = QUESTIONS[qi]
      const choices = shuffle([q.answer, ...q.distractors])
      opts.push(choices)
      correct.push(choices.indexOf(q.answer))
    }
    const sid = newSid()
    sessions.set(sid, {
      level, order, opts, correct,
      answered: order.map(() => false),
      score: 0, streak: 0, best: 0,
      createdAt: Date.now(), finalized: false,
    })
    // hand the client everything it needs to play — but NOT the answer.
    const questions = order.map((qi, i) => {
      const q = QUESTIONS[qi]
      return { track: q.track, artist: q.artist, year: q.year, options: opts[i] }
    })
    return ok(res, { sid, level, levelCount: LEVEL_COUNT, clearMin: CLEAR, total: LEVEL_SIZE, questions })
  })

  // ---- grade one pick. Immediate per-round feedback, fully server-side. ----
  app.post('/api/game/answer', rateLimit('gameAnswer', 400, 10 * 60_000), (req, res) => {
    const { sid, q, pick } = req.body || {}
    const s = sessions.get(String(sid || ''))
    if (!s) return fail(res, 410, 'This round expired. Start a new one.')
    const qi = Number(q)
    if (!Number.isInteger(qi) || qi < 0 || qi >= LEVEL_SIZE) return fail(res, 400, 'Bad question index.')
    const lang = langOf(req)
    const correctIdx = s.correct[qi]
    const answer = QUESTIONS[s.order[qi]].answer
    const fact = QUESTIONS[s.order[qi]].fact[lang] || QUESTIONS[s.order[qi]].fact.en

    // already answered → reply idempotently (tolerate double-clicks / retries)
    // without ever double-counting the score.
    if (s.answered[qi]) {
      return ok(res, {
        correct: s.picks?.[qi] === correctIdx, correctIndex: correctIdx, answer, fact,
        score: s.score, streak: s.streak, done: s.answered.every(Boolean), replay: true,
      })
    }

    const p = Number(pick)
    if (!Number.isInteger(p) || p < 0 || p > 3) return fail(res, 400, 'Bad pick.')
    s.picks = s.picks || s.order.map(() => -1)
    s.picks[qi] = p
    s.answered[qi] = true
    const correct = p === correctIdx
    if (correct) {
      s.score++
      s.streak++
      s.best = Math.max(s.best, s.streak)
    } else {
      s.streak = 0
    }

    const done = s.answered.every(Boolean)
    if (done && !s.finalized) {
      s.finalized = true
      // record only for a signed-in member. Anyone can PLAY; you appear on the
      // league + unlock levels once you're a SMPL account (identity-tied
      // reputation, no anonymous spoofing).
      if (req.user) finalize(req.user.id, s.level, s.score, s.best)
    }

    return ok(res, {
      correct, correctIndex: correctIdx, answer, fact,
      score: s.score, streak: s.streak, done,
      level: s.level, cleared: s.score >= CLEAR, clearMin: CLEAR, levelCount: LEVEL_COUNT,
    })
  })

  // ---- audio preview proxy. The phone asks OUR server for an iTunes 30s
  // preview URL instead of reaching itunes.apple.com itself: in-app webviews,
  // iOS content blockers and some networks silently kill the cross-origin
  // lookup from the device (it shows up as "no preview"). Cached hard, since the
  // catalogue is static. A non-200 from Apple (e.g. rate-limit) is reported as
  // transient so the client can retry instead of caching a false "no preview".
  const itunesCache = new Map() // term -> { url, at }
  const PREVIEW_TTL = 7 * 24 * 60 * 60_000

  app.get('/api/game/preview', rateLimit('gamePreview', 300, 10 * 60_000), async (req, res) => {
    const term = String(req.query.term || '').slice(0, 120).trim()
    if (!term) return fail(res, 400, 'Missing term.')
    const hit = itunesCache.get(term)
    if (hit && Date.now() - hit.at < PREVIEW_TTL) return ok(res, { url: hit.url })
    let url = null
    try {
      const r = await fetch(
        'https://itunes.apple.com/search?media=music&entity=song&limit=6&term=' + encodeURIComponent(term),
        { headers: { 'User-Agent': 'SMPL/1.0 (+https://usesmpl.com)' } },
      )
      if (!r.ok) return ok(res, { url: null, transient: true })
      const data = await r.json()
      const found = (data.results || []).find((x) => x.previewUrl)
      if (found) url = found.previewUrl
    } catch {
      return ok(res, { url: null, transient: true })
    }
    itunesCache.set(term, { url, at: Date.now() })
    return ok(res, { url })
  })

  // upsert "keep the best, count the play" against either score table.
  function bumpBest(table, keyCols, keyVals, score, bestStreak, now) {
    const where = keyCols.map((c) => `${c} = ?`).join(' AND ')
    const row = db.prepare(`SELECT * FROM ${table} WHERE ${where}`).get(...keyVals)
    if (!row) {
      const cols = [...keyCols, 'best', 'bestStreak', 'bestAt', 'plays', 'updatedAt']
      const qs = cols.map(() => '?').join(',')
      db.prepare(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${qs})`).run(
        ...keyVals, score, bestStreak, now, 1, now,
      )
      return
    }
    const beat = score > row.best
    db.prepare(
      `UPDATE ${table} SET best=?, bestStreak=?, bestAt=?, plays=plays+1, updatedAt=? WHERE ${where}`,
    ).run(
      beat ? score : row.best,
      Math.max(row.bestStreak || 0, bestStreak),
      beat ? now : row.bestAt,
      now,
      ...keyVals,
    )
  }

  function finalize(userId, level, score, bestStreak) {
    const now = Date.now()
    const { id: weekId } = weekBounds(now)
    // permanent all-time record (history) + the live weekly board
    bumpBest('game_scores', ['userId'], [userId], score, bestStreak, now)
    bumpBest('game_week_scores', ['weekId', 'userId'], [weekId, userId], score, bestStreak, now)

    // per-level progression: keep the best score for this level; clearing it
    // (>= CLEAR) is sticky and stamps the first clear time (league tie-break).
    const cleared = score >= CLEAR ? 1 : 0
    const row = db.prepare('SELECT * FROM game_progress WHERE userId = ? AND level = ?').get(userId, level)
    if (!row) {
      db.prepare(
        `INSERT INTO game_progress (userId, level, bestScore, bestStreak, cleared, clearedAt, plays, updatedAt)
         VALUES (?,?,?,?,?,?,?,?)`,
      ).run(userId, level, score, bestStreak, cleared, cleared ? now : null, 1, now)
    } else {
      const nowCleared = row.cleared || cleared
      db.prepare(
        `UPDATE game_progress SET bestScore = ?, bestStreak = ?, cleared = ?, clearedAt = ?, plays = plays + 1, updatedAt = ?
          WHERE userId = ? AND level = ?`,
      ).run(
        Math.max(row.bestScore, score),
        Math.max(row.bestStreak || 0, bestStreak),
        nowCleared,
        row.clearedAt || (cleared ? now : null),
        now,
        userId,
        level,
      )
    }
  }

  // ---- the board: THIS WEEK's top players + the caller's own standing ----
  app.get('/api/game/leaderboard', (req, res) => {
    const { id: weekId, endsAt } = weekBounds()
    const rows = db
      .prepare(
        `SELECT g.userId, g.best, g.bestStreak, g.bestAt, g.plays,
                u.alias, u.avatar, u.role, u.verified
           FROM game_week_scores g JOIN users u ON u.id = g.userId
          WHERE g.weekId = ?
          ORDER BY g.best DESC, g.bestAt ASC, u.alias ASC
          LIMIT 20`,
      )
      .all(weekId)
    const top = rows.map((r, i) => ({
      rank: i + 1,
      alias: r.alias,
      avatar: r.avatar || '',
      role: r.role === 'admin' ? 'curator' : r.role, // admins read as curators publicly
      verified: !!r.verified,
      best: r.best,
      bestStreak: r.bestStreak || 0,
      plays: r.plays,
    }))

    let me = null
    if (req.user) {
      const mine = db
        .prepare('SELECT * FROM game_week_scores WHERE weekId = ? AND userId = ?')
        .get(weekId, req.user.id)
      if (mine) {
        // rank = how many sit strictly above me this week under the same ordering, + 1
        const above = db
          .prepare(
            `SELECT COUNT(*) AS c FROM game_week_scores g JOIN users u ON u.id = g.userId
              WHERE g.weekId = ? AND (g.best > ? OR (g.best = ? AND g.bestAt < ?))`,
          )
          .get(weekId, mine.best, mine.best, mine.bestAt).c
        me = { rank: above + 1, best: mine.best, bestStreak: mine.bestStreak || 0, plays: mine.plays, alias: req.user.alias }
      }
    }
    const total = db.prepare('SELECT COUNT(*) AS c FROM game_week_scores WHERE weekId = ?').get(weekId).c
    return ok(res, { top, me, total, authed: !!req.user, weekId, endsAt })
  })

  // ---- level map for the picker: per-level unlock + cleared + best score ----
  app.get('/api/game/progress', (req, res) => {
    const unlocked = req.user ? unlockedThrough(req.user.id) : 1
    const rows = req.user
      ? db.prepare('SELECT level, bestScore, cleared FROM game_progress WHERE userId = ?').all(req.user.id)
      : []
    const byLevel = new Map(rows.map((r) => [r.level, r]))
    const levels = Array.from({ length: LEVEL_COUNT }, (_, i) => {
      const lvl = i + 1
      const r = byLevel.get(lvl)
      return { level: lvl, unlocked: lvl <= unlocked, cleared: !!(r && r.cleared), bestScore: r?.bestScore || 0 }
    })
    return ok(res, { levelCount: LEVEL_COUNT, clearMin: CLEAR, levelSize: LEVEL_SIZE, unlocked, authed: !!req.user, levels })
  })

  // ---- the LEAGUE: ranked by levels cleared, then points, then who first ----
  app.get('/api/game/league', (req, res) => {
    const rows = db
      .prepare(
        `SELECT g.userId,
                SUM(CASE WHEN g.cleared = 1 THEN 1 ELSE 0 END) AS levels,
                SUM(g.bestScore) AS points,
                MAX(g.clearedAt) AS lastAt,
                u.alias, u.avatar, u.role, u.verified
           FROM game_progress g JOIN users u ON u.id = g.userId
          GROUP BY g.userId
         HAVING levels > 0
          ORDER BY levels DESC, points DESC, lastAt ASC, u.alias ASC
          LIMIT 20`,
      )
      .all()
    const top = rows.map((r, i) => ({
      rank: i + 1,
      alias: r.alias,
      avatar: r.avatar || '',
      role: r.role === 'admin' ? 'curator' : r.role,
      verified: !!r.verified,
      levels: r.levels,
      points: r.points,
    }))

    let me = null
    if (req.user) {
      const mine = db
        .prepare(
          `SELECT SUM(CASE WHEN cleared = 1 THEN 1 ELSE 0 END) AS levels, SUM(bestScore) AS points, MAX(clearedAt) AS lastAt
             FROM game_progress WHERE userId = ?`,
        )
        .get(req.user.id)
      if (mine && mine.levels > 0) {
        const above = db
          .prepare(
            `SELECT COUNT(*) AS c FROM (
               SELECT userId,
                      SUM(CASE WHEN cleared = 1 THEN 1 ELSE 0 END) AS levels,
                      SUM(bestScore) AS points, MAX(clearedAt) AS lastAt
                 FROM game_progress GROUP BY userId HAVING levels > 0
             ) t
              WHERE t.levels > ? OR (t.levels = ? AND t.points > ?)
                 OR (t.levels = ? AND t.points = ? AND t.lastAt < ?)`,
          )
          .get(mine.levels, mine.levels, mine.points, mine.levels, mine.points, mine.lastAt).c
        me = { rank: above + 1, levels: mine.levels, points: mine.points, alias: req.user.alias }
      }
    }
    const total = db
      .prepare(
        `SELECT COUNT(*) AS c FROM (
           SELECT userId, SUM(CASE WHEN cleared = 1 THEN 1 ELSE 0 END) AS levels
             FROM game_progress GROUP BY userId HAVING levels > 0
         ) t`,
      )
      .get().c
    return ok(res, { top, me, total, levelCount: LEVEL_COUNT, authed: !!req.user })
  })
}
