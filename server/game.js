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

  // ---- BATCH 2 : more verified famous samples (auto-curated, iTunes-findable) ----
  { track: "Regulate", artist: "Warren G & Nate Dogg", year: 1994,
    answer: "Michael McDonald — \"I Keep Forgettin' (Every Time You're Near)\"",
    distractors: ["Steely Dan — \"Peg\"","Boz Scaggs — \"Lowdown\"","Hall & Oates — \"I Can't Go for That (No Can Do)\""],
    fact: { en: "Regulate is built almost entirely on the smooth groove of Michael McDonald's 1982 yacht-soul hit I Keep Forgettin'.", nl: "Regulate is bijna volledig gebouwd op de zachte groove van Michael McDonalds yacht-soulhit I Keep Forgettin' uit 1982." } },
  { track: "Groovejet (If This Ain't Love)", artist: "Spiller", year: 2000,
    answer: "Carol Williams — \"Love Is You\"",
    distractors: ["Loleatta Holloway — \"Love Sensation\"","First Choice — \"Let No Man Put Asunder\"","Double Exposure — \"Ten Percent\""],
    fact: { en: "Spiller's Groovejet, with vocals by Sophie Ellis-Bextor, is built on the Salsoul disco track Love Is You by Carol Williams.", nl: "Spillers Groovejet, met zang van Sophie Ellis-Bextor, is gebouwd op de Salsoul-discotrack Love Is You van Carol Williams." } },
  { track: "Another Chance", artist: "Roger Sanchez", year: 2001,
    answer: "Toto — \"I Won't Hold You Back\"",
    distractors: ["Hall & Oates — \"I Can't Go for That (No Can Do)\"","Steve Winwood — \"Valerie\"","Christopher Cross — \"Ride Like the Wind\""],
    fact: { en: "Roger Sanchez built Another Chance around a looped sample of Toto's 1982 soft-rock ballad I Won't Hold You Back.", nl: "Roger Sanchez bouwde Another Chance rond een geloopte sample van Toto's softrock-ballad I Won't Hold You Back uit 1982." } },
  { track: "I'm Good (Blue)", artist: "David Guetta & Bebe Rexha", year: 2022,
    answer: "Eiffel 65 — \"Blue (Da Ba Dee)\"",
    distractors: ["Aqua — \"Barbie Girl\"","Haddaway — \"What Is Love\"","Vengaboys — \"We Like to Party!\""],
    fact: { en: "I'm Good (Blue) reworks the melody and lyrics of Eiffel 65's 1999 Eurodance hit Blue (Da Ba Dee), with the original writers credited.", nl: "I'm Good (Blue) bewerkt de melodie en tekst van Eiffel 65's eurodance-hit Blue (Da Ba Dee) uit 1999, met de originele schrijvers gecrediteerd." } },
  { track: "Anaconda", artist: "Nicki Minaj", year: 2014,
    answer: "Sir Mix-a-Lot — \"Baby Got Back\"",
    distractors: ["Wreckx-n-Effect — \"Rump Shaker\"","2 Live Crew — \"Me So Horny\"","Tag Team — \"Whoomp! (There It Is)\""],
    fact: { en: "Anaconda is built almost entirely on a sample of Sir Mix-a-Lot's 1992 hit Baby Got Back, repeating its iconic opening lines.", nl: "Anaconda is bijna volledig gebouwd op een sample van Sir Mix-a-Lot's hit Baby Got Back uit 1992, met de iconische openingsregels herhaald." } },
  { track: "First Class", artist: "Jack Harlow", year: 2022,
    answer: "Fergie — \"Glamorous\"",
    distractors: ["Gwen Stefani — \"Hollaback Girl\"","Nelly Furtado — \"Promiscuous\"","Ciara — \"Goodies\""],
    fact: { en: "The hook flips Fergie's 2006 hit, and Harlow's number one single sent streams of the original Glamorous climbing.", nl: "De hook leunt op de hit van Fergie uit 2006, en Harlows nummer een single deed de streams van het origineel stijgen." } },
  { track: "Easy Love", artist: "Sigala", year: 2015,
    answer: "The Jackson 5 — \"ABC\"",
    distractors: ["The Jackson 5 — \"I Want You Back\"","The Temptations — \"My Girl\"","Stevie Wonder — \"I Wish\""],
    fact: { en: "Easy Love is built on a re-recorded interpolation of the Jackson 5's 1970 hit ABC.", nl: "Easy Love is gebouwd op een opnieuw ingespeelde interpolatie van ABC van The Jackson 5 uit 1970." } },
  { track: "Fast Car", artist: "Jonas Blue", year: 2015,
    answer: "Tracy Chapman — \"Fast Car\"",
    distractors: ["Suzanne Vega — \"Luka\"","Natalie Merchant — \"Carnival\"","Sheryl Crow — \"All I Wanna Do\""],
    fact: { en: "Jonas Blue's tropical-house version is a cover of Tracy Chapman's 1988 song Fast Car, sung by Dakota.", nl: "De tropical-houseversie van Jonas Blue is een cover van Fast Car van Tracy Chapman uit 1988, gezongen door Dakota." } },
  { track: "Wild Thoughts", artist: "DJ Khaled feat. Rihanna and Bryson Tiller", year: 2017,
    answer: "Santana feat. The Product G&B — \"Maria Maria\"",
    distractors: ["Santana feat. Rob Thomas — \"Smooth\"","Wyclef Jean — \"Gone Till November\"","Shakira — \"Whenever, Wherever\""],
    fact: { en: "Wild Thoughts is built almost entirely on the guitar riff and groove of Santana's 1999 hit Maria Maria, featuring The Product G&B.", nl: "Wild Thoughts is bijna volledig gebouwd op de gitaarriff en groove van Santana's hit Maria Maria uit 1999, met The Product G&B." } },
  { track: "Fantasy", artist: "Mariah Carey", year: 1995,
    answer: "Tom Tom Club — \"Genius of Love\"",
    distractors: ["Chic — \"Good Times\"","Rick James — \"Super Freak\"","Zapp — \"More Bounce to the Ounce\""],
    fact: { en: "Fantasy loops the bright keyboard riff from Tom Tom Club's 1981 funk track Genius of Love throughout the song.", nl: "Fantasy loopt de heldere keyboardriff uit Tom Tom Clubs funktrack Genius of Love uit 1981 door het hele nummer." } },
  { track: "Memories", artist: "Maroon 5", year: 2019,
    answer: "Johann Pachelbel — \"Canon in D\"",
    distractors: ["Erik Satie — \"Gymnopédie No. 1\"","Claude Debussy — \"Clair de Lune\"","Edvard Grieg — \"Morning Mood\""],
    fact: { en: "The chord progression is lifted directly from Pachelbel's 17th-century Canon in D, which is why the long-dead composer holds a writing credit on the song.", nl: "De akkoordenreeks komt rechtstreeks uit Pachelbels 17e-eeuwse Canon in D, daarom staat de allang overleden componist als medeschrijver vermeld." } },
  { track: "Big Poppa", artist: "The Notorious B.I.G.", year: 1994,
    answer: "The Isley Brothers — \"Between the Sheets\"",
    distractors: ["The Whispers — \"And the Beat Goes On\"","Bloodstone — \"Natural High\"","The Dramatics — \"In the Rain\""],
    fact: { en: "Big Poppa is built almost entirely on the groove of The Isley Brothers' 1983 Between the Sheets.", nl: "Big Poppa is bijna volledig gebouwd op de groove van The Isley Brothers' Between the Sheets uit 1983." } },
  { track: "The Time (Dirty Bit)", artist: "The Black Eyed Peas", year: 2010,
    answer: "Bill Medley & Jennifer Warnes — \"(I've Had) The Time of My Life\"",
    distractors: ["Berlin — \"Take My Breath Away\"","Irene Cara — \"Flashdance... What a Feeling\"","Kenny Loggins — \"Footloose\""],
    fact: { en: "The chorus of The Time interpolates the (I've Had) The Time of My Life hook from the 1987 film Dirty Dancing, sung by Bill Medley and Jennifer Warnes.", nl: "Het refrein van The Time interpoleert de hook van (I've Had) The Time of My Life uit de film Dirty Dancing uit 1987, gezongen door Bill Medley en Jennifer Warnes." } },
  { track: "The Next Episode", artist: "Dr. Dre", year: 1999,
    answer: "David McCallum — \"The Edge\"",
    distractors: ["David Axelrod — \"Holy Thursday\"","The Electric Prunes — \"Kyrie Eleison\"","Cannonball Adderley — \"Walk Tall\""],
    fact: { en: "The main riff is sampled from actor David McCallum's 1967 instrumental The Edge, arranged and produced by David Axelrod.", nl: "Het hoofdriff is gesampled uit het instrumentale The Edge van acteur David McCallum uit 1967, gearrangeerd en geproduceerd door David Axelrod." } },
  { track: "Let Me Ride", artist: "Dr. Dre", year: 1992,
    answer: "Parliament — \"Mothership Connection (Star Child)\"",
    distractors: ["Funkadelic — \"(Not Just) Knee Deep\"","Parliament — \"Flash Light\"","Bootsy Collins — \"I'd Rather Be with You\""],
    fact: { en: "The chorus samples and interpolates Parliament's 1976 Mothership Connection (Star Child), itself quoting the spiritual Swing Down Sweet Chariot.", nl: "Het refrein sampelt en interpoleert Parliaments Mothership Connection (Star Child) uit 1976, dat zelf het spiritual Swing Down Sweet Chariot citeert." } },
  { track: "Who Am I (What's My Name)?", artist: "Snoop Doggy Dogg", year: 1993,
    answer: "George Clinton — \"Atomic Dog\"",
    distractors: ["The Gap Band — \"Early in the Morning\"","Parliament — \"Give Up the Funk (Tear the Roof off the Sucker)\"","Zapp — \"More Bounce to the Ounce\""],
    fact: { en: "Dr. Dre built the hook around George Clinton's 1982 funk classic Atomic Dog, layering in other P-Funk samples underneath.", nl: "Dr. Dre bouwde de hook rond George Clintons funkklassieker Atomic Dog uit 1982, met daaronder andere P-Funk-samples." } },
  { track: "Keep Ya Head Up", artist: "2Pac", year: 1993,
    answer: "Zapp — \"Be Alright\"",
    distractors: ["Roger — \"I Want to Be Your Man\"","The Gap Band — \"Outstanding\"","Cameo — \"Candy\""],
    fact: { en: "The instrumental loops Zapp's 1981 Be Alright, while the chorus interpolates The Five Stairsteps' O-o-h Child.", nl: "Het instrumentaal loopt Zapps Be Alright uit 1981, terwijl het refrein The Five Stairsteps' O-o-h Child interpoleert." } },
  { track: "i", artist: "Kendrick Lamar", year: 2014,
    answer: "The Isley Brothers — \"That Lady (Part 1 & 2)\"",
    distractors: ["The Isley Brothers — \"Between the Sheets\"","The Isley Brothers — \"Footsteps in the Dark\"","Funkadelic — \"Maggot Brain\""],
    fact: { en: "i is built on the guitar riff of The Isley Brothers' 1973 That Lady, with the band's parts re-recorded for the track rather than sampled directly.", nl: "i is gebouwd op de gitaarriff van The Isley Brothers' That Lady uit 1973, met opnieuw ingespeelde partijen in plaats van een directe sample." } },
  { track: "Fantastic Voyage", artist: "Coolio", year: 1994,
    answer: "Lakeside — \"Fantastic Voyage\"",
    distractors: ["The Gap Band — \"Burn Rubber on Me\"","Cameo — \"She's Strange\"","Slave — \"Watching You\""],
    fact: { en: "Coolio's Fantastic Voyage is built heavily on Lakeside's 1980 funk song of the same name.", nl: "Coolio's Fantastic Voyage is sterk gebouwd op Lakesides gelijknamige funknummer uit 1980." } },
  { track: "I Ain't Mad at Cha", artist: "2Pac", year: 1996,
    answer: "DeBarge — \"A Dream\"",
    distractors: ["DeBarge — \"Stay with Me\"","The Jones Girls — \"You Gonna Make Me Love Somebody Else\"","Switch — \"There'll Never Be\""],
    fact: { en: "Produced by Daz Dillinger, the track loops the soft keyboard intro of DeBarge's 1983 song A Dream.", nl: "Geproduceerd door Daz Dillinger, loopt de track de zachte keyboardintro van DeBarge's nummer A Dream uit 1983." } },
  { track: "Original Nuttah", artist: "UK Apache & Shy FX", year: 1994,
    answer: "The Winstons — \"Amen, Brother\"",
    distractors: ["Lyn Collins — \"Think (About It)\"","The Honey Drippers — \"Impeach the President\"","James Brown — \"Funky Drummer\""],
    fact: { en: "Like much of jungle, Original Nuttah is driven by the Amen break, the drum solo from The Winstons' 1969 B-side Amen, Brother.", nl: "Zoals veel jungle wordt Original Nuttah aangedreven door de Amen-break, de drumsolo uit The Winstons' B-kant Amen, Brother uit 1969." } },
  { track: "Incredible", artist: "M-Beat featuring General Levy", year: 1994,
    answer: "The Winstons — \"Amen, Brother\"",
    distractors: ["Lyn Collins — \"Think (About It)\"","Bobby Byrd — \"Hot Pants\"","Manzel — \"Midnight Theme\""],
    fact: { en: "M-Beat and General Levy's jungle crossover Incredible rides the Amen break from The Winstons' 1969 track Amen, Brother.", nl: "M-Beat en General Levy's jungle-crossover Incredible gebruikt de Amen-break uit The Winstons' nummer Amen, Brother uit 1969." } },
  { track: "Bound 4 da Reload (Casualty)", artist: "Oxide & Neutrino", year: 2000,
    answer: "Ken Freeman — \"BBC Casualty Theme\"",
    distractors: ["Sandy B — \"Make the World Go Round\"","Double 99 — \"Ripgroove\"","Wookie — \"Battle\""],
    fact: { en: "This UK garage number one samples Ken Freeman's theme tune to the BBC medical drama Casualty, alongside a gunshot vocal lifted from the film Lock, Stock and Two Smoking Barrels.", nl: "Deze UK garage nummer een sampelt Ken Freeman's titelmuziek van de BBC-medische serie Casualty, naast een schot-vocal uit de film Lock, Stock and Two Smoking Barrels." } },
  { track: "1999", artist: "Cassius", year: 1999,
    answer: "Donna Summer — \"(If It) Hurts Just a Little\"",
    distractors: ["Donna Summer — \"I Feel Love\"","Donna Summer — \"Love to Love You Baby\"","Donna Summer — \"Hot Stuff\""],
    fact: { en: "Cassius built 1999 from a filtered loop of Donna Summer's 1982 track (If It) Hurts Just a Little, not one of her better-known disco hits.", nl: "Cassius bouwde 1999 uit een gefilterde loop van Donna Summers nummer (If It) Hurts Just a Little uit 1982, niet een van haar bekendere discohits." } },
  { track: "Feeling for You", artist: "Cassius", year: 1999,
    answer: "Gwen McCrae — \"All This Love That I'm Givin'\"",
    distractors: ["Evelyn King — \"Shame\"","Cheryl Lynn — \"Got to Be Real\"","Anita Ward — \"Ring My Bell\""],
    fact: { en: "Cassius looped the vocal hook from Gwen McCrae's 1979 disco-soul track All This Love That I'm Givin' for Feeling for You.", nl: "Cassius loopte de vocale hook uit Gwen McCrae's disco-soultrack All This Love That I'm Givin' uit 1979 voor Feeling for You." } },
  { track: "Make Luv", artist: "Room 5", year: 2003,
    answer: "Oliver Cheatham — \"Get Down Saturday Night\"",
    distractors: ["Leroy Burgess — \"Heartbreaker\"","Kleeer — \"Intimate Connection\"","Change — \"A Lover's Holiday\""],
    fact: { en: "Room 5's Make Luv loops the vocals from Oliver Cheatham's 1983 boogie track Get Down Saturday Night, with Cheatham credited.", nl: "Room 5's Make Luv loopt de zang uit Oliver Cheathams boogietrack Get Down Saturday Night uit 1983, met Cheatham gecrediteerd." } },
  { track: "Lola's Theme", artist: "The Shapeshifters", year: 2004,
    answer: "Johnnie Taylor — \"What About My Love\"",
    distractors: ["Lou Rawls — \"You'll Never Find Another Love Like Mine\"","Harold Melvin & the Blue Notes — \"Don't Leave Me This Way\"","Teddy Pendergrass — \"Love T.K.O.\""],
    fact: { en: "The Shapeshifters built Lola's Theme around the intro of Johnnie Taylor's 1982 soul track What About My Love.", nl: "The Shapeshifters bouwden Lola's Theme rond de intro van Johnnie Taylors soultrack What About My Love uit 1982." } },
  { track: "Don't Call Me Baby", artist: "Madison Avenue", year: 1999,
    answer: "Pino D'Angiò — \"Ma Quale Idea\"",
    distractors: ["Raffaella Carrà — \"A Far l'Amore Comincia Tu\"","La Bionda — \"One for You, One for Me\"","Cerrone — \"Supernature\""],
    fact: { en: "Madison Avenue's Don't Call Me Baby is built on the bassline from Italian singer Pino D'Angiò's 1980 song Ma Quale Idea.", nl: "Madison Avenue's Don't Call Me Baby is gebouwd op de baslijn uit het nummer Ma Quale Idea van de Italiaanse zanger Pino D'Angiò uit 1980." } },
  { track: "Starlight", artist: "The Supermen Lovers", year: 2001,
    answer: "East Coast — \"The Rock\"",
    distractors: ["Vaughan Mason & Crew — \"Bounce, Rock, Skate, Roll\"","Karen Young — \"Hot Shot\"","Sylvester — \"You Make Me Feel (Mighty Real)\""],
    fact: { en: "The Supermen Lovers' Starlight, sung by Mani Hoffman, is built on a sample of the 1978 disco track The Rock by East Coast.", nl: "The Supermen Lovers' Starlight, gezongen door Mani Hoffman, is gebouwd op een sample van de discotrack The Rock van East Coast uit 1978." } },
  { track: "Sour Times", artist: "Portishead", year: 1994,
    answer: "Lalo Schifrin — \"Danube Incident\"",
    distractors: ["Henry Mancini — \"Lujon\"","Ennio Morricone — \"The Sundown\"","John Barry — \"007\""],
    fact: { en: "The eerie cimbalom riff in Sour Times comes from Lalo Schifrin's Danube Incident, a cue he wrote for the Mission: Impossible TV series.", nl: "De spookachtige cimbalom-riff in Sour Times komt van Lalo Schifrins Danube Incident." } },
  { track: "Break My Heart", artist: "Dua Lipa", year: 2020,
    answer: "INXS — \"Need You Tonight\"",
    distractors: ["The Police — \"Every Breath You Take\"","Tears for Fears — \"Everybody Wants to Rule the World\"","Duran Duran — \"Notorious\""],
    fact: { en: "The guitar riff in Break My Heart interpolates INXS's 1987 hit Need You Tonight, and the band's members were added to the songwriting credits.", nl: "De gitaarriff in Break My Heart interpoleert INXS' hit Need You Tonight uit 1987, en de bandleden werden toegevoegd aan de schrijfcredits." } },
  { track: "Big Energy", artist: "Latto", year: 2021,
    answer: "Mariah Carey — \"Fantasy\"",
    distractors: ["TLC — \"Creep\"","SWV — \"Right Here (Human Nature)\"","Brandy — \"I Wanna Be Down\""],
    fact: { en: "Big Energy interpolates Mariah Carey's 1995 hit Fantasy, which itself sampled Tom Tom Club's Genius of Love; an official remix with Carey later followed.", nl: "Big Energy interpoleert Mariah Carey's hit Fantasy uit 1995, die zelf Tom Tom Club's Genius of Love sampelde; later volgde een officiële remix met Carey." } },
  { track: "Stay With Me", artist: "Sam Smith", year: 2014,
    answer: "Tom Petty — \"I Won't Back Down\"",
    distractors: ["Bruce Springsteen — \"I'm on Fire\"","John Mellencamp — \"Jack & Diane\"","Don Henley — \"The Boys of Summer\""],
    fact: { en: "After a dispute over melodic similarity, Tom Petty and Jeff Lynne were added to the writing credits of Stay With Me for their 1989 song I Won't Back Down.", nl: "Na een geschil over melodische gelijkenis werden Tom Petty en Jeff Lynne toegevoegd aan de schrijfcredits van Stay With Me, vanwege hun nummer I Won't Back Down uit 1989." } },
  { track: "Midnight Sky", artist: "Miley Cyrus", year: 2020,
    answer: "Stevie Nicks — \"Edge of Seventeen\"",
    distractors: ["Pat Benatar — \"Heartbreaker\"","Heart — \"Barracuda\"","Blondie — \"Heart of Glass\""],
    fact: { en: "Midnight Sky interpolates Stevie Nicks's 1981 song Edge of Seventeen, and Nicks was credited and later featured on a remix version.", nl: "Midnight Sky interpoleert Stevie Nicks' nummer Edge of Seventeen uit 1981, en Nicks werd gecrediteerd en later gastartiest op een remixversie." } },
  { track: "Your Love (9PM)", artist: "ATB, Topic & A7S", year: 2021,
    answer: "ATB — \"9 PM (Till I Come)\"",
    distractors: ["Robert Miles — \"Children\"","Sash! — \"Encore une Fois\"","Faithless — \"Insomnia\""],
    fact: { en: "Your Love (9PM) reworks the signature guitar-synth hook of ATB's own 1998 trance classic 9 PM (Till I Come).", nl: "Your Love (9PM) bewerkt de kenmerkende gitaar-synthhook van ATB's eigen trance-klassieker 9 PM (Till I Come) uit 1998." } },
  { track: "Be Careful", artist: "Cardi B", year: 2018,
    answer: "Lauryn Hill — \"Ex-Factor\"",
    distractors: ["Erykah Badu — \"On & On\"","Mary J. Blige — \"Be Without You\"","Alicia Keys — \"Fallin'\""],
    fact: { en: "Cardi B's track interpolates Lauryn Hill's 1998 song, the same Miseducation cut Drake sampled for Nice for What that same year.", nl: "De track van Cardi B leunt op het nummer van Lauryn Hill uit 1998, dezelfde Miseducation-plaat die Drake datzelfde jaar gebruikte voor Nice for What." } },
  { track: "What You Know Bout Love", artist: "Pop Smoke", year: 2020,
    answer: "Ginuwine — \"Differences\"",
    distractors: ["Usher — \"Nice & Slow\"","Joe — \"I Wanna Know\"","Tyrese — \"Sweet Lady\""],
    fact: { en: "The posthumous Pop Smoke single is built around Ginuwine's 2001 R&B ballad Differences.", nl: "De postume single van Pop Smoke is gebouwd rond Differences, de R&B-ballad van Ginuwine uit 2001." } },
  { track: "The Story of O.J.", artist: "JAY-Z", year: 2017,
    answer: "Nina Simone — \"Four Women\"",
    distractors: ["Aretha Franklin — \"Young, Gifted and Black\"","Roberta Flack — \"Compared to What\"","Gil Scott-Heron — \"The Revolution Will Not Be Televised\""],
    fact: { en: "Producer No I.D. chopped Nina Simone's 1966 song Four Women throughout the track, pitching her voice in and out.", nl: "Producer No I.D. versneed Nina Simone's nummer Four Women uit 1966 door de hele track, met haar stem die in en uit faseert." } },
  { track: "Sugar", artist: "Robin Schulz", year: 2015,
    answer: "Baby Bash — \"Suga Suga\"",
    distractors: ["Nelly — \"Hot in Herre\"","Sean Paul — \"Get Busy\"","Sisqo — \"Thong Song\""],
    fact: { en: "Schulz's Sugar, with Francesco Yates, reworks the chorus of Baby Bash and Frankie J's 2003 single Suga Suga.", nl: "Sugar van Schulz, met Francesco Yates, bewerkt het refrein van Suga Suga van Baby Bash en Frankie J uit 2003." } },
  { track: "Show Me Love", artist: "Sam Feldt", year: 2015,
    answer: "Robin S. — \"Show Me Love\"",
    distractors: ["CeCe Peniston — \"Finally\"","Crystal Waters — \"Gypsy Woman\"","Black Box — \"Ride on Time\""],
    fact: { en: "Feldt's track reworks Robin S.'s 1993 house anthem Show Me Love, with new vocals by Kimberly Anne.", nl: "Feldts track bewerkt het housenummer Show Me Love van Robin S. uit 1993, met nieuwe zang van Kimberly Anne." } },
  { track: "Cheerleader (Felix Jaehn Remix)", artist: "OMI", year: 2014,
    answer: "OMI — \"Cheerleader\"",
    distractors: ["Inner Circle — \"Sweat (A La La La La Long)\"","Shaggy — \"Angel\"","Sean Kingston — \"Beautiful Girls\""],
    fact: { en: "Felix Jaehn's chart-topping remix reworks OMI's original 2012 recording of Cheerleader.", nl: "De wereldwijde nummer 1-remix van Felix Jaehn bewerkt OMI's originele Cheerleader-opname uit 2012." } },
  { track: "Sex", artist: "Cheat Codes & Kris Kross Amsterdam", year: 2017,
    answer: "Salt-N-Pepa — \"Let's Talk About Sex\"",
    distractors: ["TLC — \"Ain't 2 Proud 2 Beg\"","En Vogue — \"My Lovin'\"","Naughty by Nature — \"O.P.P.\""],
    fact: { en: "The track reuses the chorus from Salt-N-Pepa's 1991 single Let's Talk About Sex.", nl: "De track hergebruikt het refrein van Let's Talk About Sex van Salt-N-Pepa uit 1991." } },
  { track: "Feel Your Love", artist: "Dimitri Vegas & Like Mike, Timmy Trumpet & Edward Maya", year: 2021,
    answer: "Guru Josh — \"Infinity\"",
    distractors: ["Robert Miles — \"Children\"","Energy 52 — \"Café del Mar\"","Snap! — \"Rhythm Is a Dancer\""],
    fact: { en: "Feel Your Love samples the saxophone hook of Guru Josh's 1990 rave classic Infinity.", nl: "Feel Your Love samplet de saxofoonhook van de raveklassieker Infinity van Guru Josh uit 1990." } },
  { track: "Work", artist: "Rihanna feat. Drake", year: 2016,
    answer: "Richie Stephens and Mikey 2000 — \"Sail Away (Riddim)\"",
    distractors: ["Steely & Clevie — \"Bam Bam (Riddim)\"","Dave Kelly — \"Joyride (Riddim)\"","Sly & Robbie — \"Murder She Wrote (Riddim)\""],
    fact: { en: "Work is built on the 1998 Sail Away riddim by Richie Stephens and Mikey 2000, who were credited and cleared the sample.", nl: "Work is gebouwd op de Sail Away riddim uit 1998 van Richie Stephens en Mikey 2000, die werden vermeld en de sample klaarden." } },
  { track: "Controlla", artist: "Drake", year: 2016,
    answer: "Beenie Man — \"Tear Off Mi Garment\"",
    distractors: ["Wayne Wonder — \"No Letting Go\"","Mr. Vegas — \"Heads High\"","Tony Matterhorn — \"Dutty Wine\""],
    fact: { en: "Controlla samples Beenie Man's 1995 dancehall cut Tear Off Mi Garment, and Beenie Man recorded an intro for the track.", nl: "Controlla samplet Beenie Mans dancehall-nummer Tear Off Mi Garment uit 1995, en Beenie Man nam een intro voor het nummer op." } },
  { track: "One Dance", artist: "Drake feat. Wizkid and Kyla", year: 2016,
    answer: "DJ Paleface feat. Kyla — \"Do You Mind (Crazy Cousinz Remix)\"",
    distractors: ["Donae'o — \"Party Hard\"","Funky Dee — \"Are You Gonna Bang Doe\"","Gracious K — \"Migraine Skank\""],
    fact: { en: "One Dance slows down the vocals and piano of Kyla's 2008 UK funky anthem Do You Mind in the Crazy Cousinz remix, with Kyla and Crazy Cousinz credited as writers.", nl: "One Dance vertraagt de zang en piano van Kyla's UK funky-hit Do You Mind uit 2008 in de Crazy Cousinz-remix, met Kyla en Crazy Cousinz als schrijvers vermeld." } },
  { track: "Let Me Love You", artist: "DJ Snake feat. Justin Bieber", year: 2016,
    answer: "Lumidee — \"Never Leave You (Uh Oooh, Uh Oooh)\"",
    distractors: ["Wayne Wonder — \"No Letting Go\"","Sean Paul — \"Get Busy\"","Kevin Lyttle — \"Turn Me On\""],
    fact: { en: "Let Me Love You samples Lumidee's 2003 hit Never Leave You, itself built on the Diwali riddim.", nl: "Let Me Love You samplet Lumidees hit Never Leave You uit 2003, die zelf op de Diwali riddim is gebouwd." } },
  { track: "Here Comes the Hotstepper", artist: "Ini Kamoze", year: 1994,
    answer: "Cannibal & the Headhunters — \"Land of 1000 Dances\"",
    distractors: ["Toots & the Maytals — \"Pressure Drop\"","Dave and Ansell Collins — \"Double Barrel\"","Desmond Dekker — \"Israelites\""],
    fact: { en: "Here Comes the Hotstepper borrows the na-na-na hook popularized by Cannibal & the Headhunters' 1965 version of Land of 1000 Dances.", nl: "Here Comes the Hotstepper leent de na-na-na-hook die populair werd door Cannibal & the Headhunters' versie van Land of 1000 Dances uit 1965." } },
  { track: "My Life", artist: "Mary J. Blige", year: 1994,
    answer: "Roy Ayers — \"Everybody Loves the Sunshine\"",
    distractors: ["Lonnie Liston Smith — \"Expansions\"","Bobbi Humphrey — \"Harlem River Drive\"","Donald Byrd — \"Think Twice\""],
    fact: { en: "My Life is built on the warm keys and backing vocals of Roy Ayers' 1976 jazz-funk song Everybody Loves the Sunshine.", nl: "My Life is gebouwd op de warme toetsen en achtergrondzang uit Roy Ayers' jazz-funknummer Everybody Loves the Sunshine uit 1976." } },
  { track: "Love Like This", artist: "Faith Evans", year: 1998,
    answer: "Chic — \"Chic Cheer\"",
    distractors: ["Chic — \"Good Times\"","Sister Sledge — \"Lost in Music\"","Sister Sledge — \"He's the Greatest Dancer\""],
    fact: { en: "Love Like This is built around a looped sample of Chic's 1978 disco-funk track Chic Cheer.", nl: "Love Like This is gebouwd rond een geloopte sample van Chics disco-funktrack Chic Cheer uit 1978." } },
  { track: "Bag Lady", artist: "Erykah Badu", year: 2000,
    answer: "Isaac Hayes — \"Bumpy's Lament\"",
    distractors: ["Isaac Hayes — \"Walk on By\"","Curtis Mayfield — \"Pusherman\"","Bobby Womack — \"Across 110th Street\""],
    fact: { en: "Bag Lady is built on Isaac Hayes' 1971 Shaft instrumental Bumpy's Lament, by way of the beat Dr. Dre had already used for Xxplosive.", nl: "Bag Lady is gebouwd op Isaac Hayes' Shaft-instrumentaal Bumpy's Lament uit 1971, via de beat die Dr. Dre al voor Xxplosive gebruikte." } },
  { track: "You Don't Know My Name", artist: "Alicia Keys", year: 2003,
    answer: "The Main Ingredient — \"Let Me Prove My Love to You\"",
    distractors: ["The Stylistics — \"You Are Everything\"","The Delfonics — \"La-La (Means I Love You)\"","The Spinners — \"I'll Be Around\""],
    fact: { en: "Kanye West produced You Don't Know My Name around the piano and backing vocals of The Main Ingredient's 1975 song Let Me Prove My Love to You.", nl: "Kanye West produceerde You Don't Know My Name rond de piano en achtergrondzang uit The Main Ingredients nummer Let Me Prove My Love to You uit 1975." } },
  { track: "Dreamlover", artist: "Mariah Carey", year: 1993,
    answer: "The Emotions — \"Blind Alley\"",
    distractors: ["The Emotions — \"Best of My Love\"","The Three Degrees — \"When Will I See You Again\"","The Pointer Sisters — \"Yes We Can Can\""],
    fact: { en: "Dreamlover lifts its main hook from the 1972 funk-soul track Blind Alley by The Emotions, a loop also used in Big Daddy Kane's Ain't No Half-Steppin'.", nl: "Dreamlover haalt de hoofdhook uit de funk-soultrack Blind Alley van The Emotions uit 1972, een loop die ook in Big Daddy Kanes Ain't No Half-Steppin' zit." } },
  { track: "Right Here (Human Nature Remix)", artist: "SWV", year: 1993,
    answer: "Michael Jackson — \"Human Nature\"",
    distractors: ["Michael Jackson — \"P.Y.T. (Pretty Young Thing)\"","Michael Jackson — \"Rock with You\"","Quincy Jones — \"Ai No Corrida\""],
    fact: { en: "Teddy Riley's remix of Right Here is built on Michael Jackson's 1982 song Human Nature, a sample Jackson cleared for the group at no cost.", nl: "Teddy Rileys remix van Right Here is gebouwd op Michael Jacksons nummer Human Nature uit 1982, een sample die Jackson gratis voor de groep vrijgaf." } },
  { track: "Tears Dry on Their Own", artist: "Amy Winehouse", year: 2007,
    answer: "Marvin Gaye & Tammi Terrell — \"Ain't No Mountain High Enough\"",
    distractors: ["Marvin Gaye & Tammi Terrell — \"You're All I Need to Get By\"","Marvin Gaye — \"How Sweet It Is (To Be Loved by You)\"","The Supremes — \"You Keep Me Hangin' On\""],
    fact: { en: "Tears Dry on Their Own interpolates the Ashford and Simpson backing track of Marvin Gaye and Tammi Terrell's 1967 song Ain't No Mountain High Enough.", nl: "Tears Dry on Their Own interpoleert de door Ashford en Simpson geschreven begeleiding van Marvin Gaye en Tammi Terrells nummer Ain't No Mountain High Enough uit 1967." } },
  { track: "Freak Like Me", artist: "Sugababes", year: 2002,
    answer: "Tubeway Army — \"Are 'Friends' Electric?\"",
    distractors: ["The Human League — \"Don't You Want Me\"","Soft Cell — \"Tainted Love\"","Depeche Mode — \"Just Can't Get Enough\""],
    fact: { en: "Producer Richard X built the track over the synth line from Gary Numan's 1979 Tubeway Army hit, and Numan was credited as co-writer.", nl: "Producer Richard X bouwde de track op de synthlijn van Gary Numans Tubeway Army-hit uit 1979; Numan kreeg een schrijverscredit." } },
  { track: "Millennium", artist: "Robbie Williams", year: 1998,
    answer: "John Barry & Nancy Sinatra — \"You Only Live Twice\"",
    distractors: ["Shirley Bassey — \"Goldfinger\"","Tom Jones — \"Thunderball\"","Matt Monro — \"From Russia with Love\""],
    fact: { en: "The sweeping strings interpolate John Barry's theme from the 1967 Bond film, re-recorded by a new string section because that cost a tenth of the sample-licensing fee.", nl: "De zwierige strijkers verwijzen naar John Barry's thema uit de Bondfilm van 1967, opnieuw opgenomen omdat dat een tiende kostte van de samplelicentie." } },
  { track: "Groove Is in the Heart", artist: "Deee-Lite", year: 1990,
    answer: "Herbie Hancock — \"Bring Down the Birds\"",
    distractors: ["Lonnie Liston Smith — \"Expansions\"","Donald Byrd — \"Black Byrd\"","Roy Ayers — \"Everybody Loves the Sunshine\""],
    fact: { en: "The wobbly bassline is sampled from Herbie Hancock's 1966 instrumental, with Bootsy Collins and Q-Tip guesting on the track.", nl: "De wiebelige basline komt uit Herbie Hancocks instrumental uit 1966; Bootsy Collins en Q-Tip zijn te gast op de track." } },
  { track: "Got 'til It's Gone", artist: "Janet Jackson", year: 1997,
    answer: "Joni Mitchell — \"Big Yellow Taxi\"",
    distractors: ["Carole King — \"It's Too Late\"","Carly Simon — \"You're So Vain\"","Joan Baez — \"Diamonds & Rust\""],
    fact: { en: "The hook samples Joni Mitchell's 1970 line \"you don't know what you've got till it's gone\"; Mitchell and Q-Tip are both credited as featured artists.", nl: "De hook samplet Joni Mitchells regel uit 1970 \"you don't know what you've got till it's gone\"; Mitchell en Q-Tip staan beiden als gastartiest vermeld." } },
  { track: "Sing for the Moment", artist: "Eminem", year: 2002,
    answer: "Aerosmith — \"Dream On\"",
    distractors: ["Kansas — \"Carry On Wayward Son\"","Boston — \"More Than a Feeling\"","Journey — \"Don't Stop Believin'\""],
    fact: { en: "The chorus samples Steven Tyler's vocal from Aerosmith's 1973 ballad, and Joe Perry plays the closing guitar solo.", nl: "Het refrein samplet Steven Tylers zang uit Aerosmiths ballad van 1973, en Joe Perry speelt de afsluitende gitaarsolo." } },
  { track: "Been Around the World", artist: "Puff Daddy", year: 1997,
    answer: "David Bowie — \"Let's Dance\"",
    distractors: ["Lipps Inc — \"Funkytown\"","Chic — \"Good Times\"","Sister Sledge — \"He's the Greatest Dancer\""],
    fact: { en: "Puff Daddy's Been Around the World samples David Bowie's 1983 hit Let's Dance, with the hook nodding to Lisa Stansfield's All Around the World.", nl: "Been Around the World van Puff Daddy samplet David Bowie's hit Let's Dance uit 1983, met een knipoog naar Lisa Stansfield's All Around the World in de hook." } },
  { track: "Return of the Mack", artist: "Mark Morrison", year: 1996,
    answer: "Tom Tom Club — \"Genius of Love\"",
    distractors: ["Cheryl Lynn — \"Got to Be Real\"","Evelyn King — \"Love Come Down\"","Chic — \"Le Freak\""],
    fact: { en: "Mark Morrison's Return of the Mack samples the groove of Tom Tom Club's 1981 Genius of Love.", nl: "Return of the Mack van Mark Morrison samplet de groove van Tom Tom Club's Genius of Love uit 1981." } },
  { track: "You Make Me Feel (Mighty Real)", artist: "Byron Stingily", year: 1998,
    answer: "Sylvester — \"You Make Me Feel (Mighty Real)\"",
    distractors: ["Sylvester — \"Dance (Disco Heat)\"","Loleatta Holloway — \"Love Sensation\"","Carl Bean — \"I Was Born This Way\""],
    fact: { en: "Byron Stingily's house version reworks Sylvester's 1978 disco classic You Make Me Feel (Mighty Real).", nl: "Byron Stingily's houseversie bewerkt Sylvesters discoklassieker You Make Me Feel (Mighty Real) uit 1978." } },
  { track: "At Night", artist: "Shakedown", year: 2002,
    answer: "Sheila & B. Devotion — \"Spacer\"",
    distractors: ["Chic — \"Good Times\"","Sister Sledge — \"Thinking of You\"","Diana Ross — \"Upside Down\""],
    fact: { en: "Shakedown's At Night is built on the bassline from Sheila & B. Devotion's 1979 Chic-produced track Spacer.", nl: "Shakedown's At Night is gebouwd op de baslijn van Sheila & B. Devotion's door Chic geproduceerde Spacer uit 1979." } },
  { track: "Jesus Walks", artist: "Kanye West", year: 2004,
    answer: "The ARC Choir — \"Walk With Me\"",
    distractors: ["The Edwin Hawkins Singers — \"Oh Happy Day\"","The Staple Singers — \"I'll Take You There\"","Sister Rosetta Tharpe — \"Up Above My Head\""],
    fact: { en: "The choir vocals come from the ARC Choir's 1997 gospel recording of the traditional hymn Walk With Me.", nl: "De koorvocalen komen uit de gospelopname van The ARC Choir uit 1997 van de traditionele hymne Walk With Me." } },
  { track: "Hard Knock Life (Ghetto Anthem)", artist: "Jay-Z", year: 1998,
    answer: "The cast of Annie — \"It's the Hard Knock Life\"",
    distractors: ["The cast of Oliver! — \"Consider Yourself\"","The cast of Bye Bye Birdie — \"Put On a Happy Face\"","The cast of The Sound of Music — \"Do-Re-Mi\""],
    fact: { en: "Jay-Z built the hook around the children's chorus from the 1977 Broadway musical Annie.", nl: "Jay-Z bouwde de hook rond het kinderkoor uit de Broadwaymusical Annie uit 1977." } },
  { track: "Don't Stop the Music", artist: "Rihanna", year: 2007,
    answer: "Michael Jackson — \"Wanna Be Startin' Somethin'\"",
    distractors: ["Michael Jackson — \"Don't Stop 'Til You Get Enough\"","The Jacksons — \"Shake Your Body (Down to the Ground)\"","Manu Dibango — \"Soul Makossa\""],
    fact: { en: "The mama-say mama-sa hook is interpolated from Michael Jackson's 1983 track, itself drawn from Manu Dibango.", nl: "De mama-say mama-sa-hook is geinterpoleerd uit Michael Jacksons track uit 1983, zelf ontleend aan Manu Dibango." } },
  { track: "Everytime We Touch", artist: "Cascada", year: 2006,
    answer: "Maggie Reilly — \"Everytime We Touch\"",
    distractors: ["Sandra — \"Maria Magdalena\"","Alphaville — \"Forever Young\"","Kim Wilde — \"Kids in America\""],
    fact: { en: "Cascada's eurodance hit lifts the chorus melody and lyric from Scottish singer Maggie Reilly's 1992 synth-pop song, and Reilly is credited as a co-writer.", nl: "Cascada's eurodance-hit leent de refreinmelodie en tekst van het synth-popnummer van de Schotse zangeres Maggie Reilly uit 1992, en Reilly staat als medeschrijver gecrediteerd." } },
  { track: "Naughty Girl", artist: "Beyoncé", year: 2003,
    answer: "Donna Summer — \"Love to Love You Baby\"",
    distractors: ["Giorgio Moroder — \"The Chase\"","Sylvester — \"You Make Me Feel (Mighty Real)\"","Patrick Cowley — \"Menergy\""],
    fact: { en: "Beyoncé's Naughty Girl interpolates the breathy hook and groove of Donna Summer's 1975 disco track Love to Love You Baby.", nl: "Beyoncé's Naughty Girl interpoleert de hijgerige hook en groove van Donna Summers discotrack Love to Love You Baby uit 1975." } },
  { track: "On the Floor", artist: "Jennifer Lopez", year: 2011,
    answer: "Kaoma — \"Lambada\"",
    distractors: ["Gipsy Kings — \"Bamboleo\"","Los Del Rio — \"Macarena\"","Las Ketchup — \"Aserejé\""],
    fact: { en: "On the Floor interpolates the melody made famous by Kaoma's 1989 hit Lambada, originally the Los Kjarkas song Llorando se fue, whose writers are credited and licensed.", nl: "On the Floor interpoleert de melodie die bekend werd door Kaoma's hit Lambada uit 1989, oorspronkelijk het nummer Llorando se fue van Los Kjarkas, wiens schrijvers gecrediteerd en gelicentieerd zijn." } },
  { track: "Good Feeling", artist: "Flo Rida", year: 2011,
    answer: "Etta James — \"Something's Got a Hold on Me\"",
    distractors: ["Aretha Franklin — \"Rock Steady\"","Tina Turner — \"Nutbush City Limits\"","Martha Reeves — \"Dancing in the Street\""],
    fact: { en: "Good Feeling samples Avicii's Levels, which lifts its euphoric vocal from Etta James's 1962 song Something's Got a Hold on Me.", nl: "Good Feeling sampelt Avicii's Levels, dat zijn euforische vocaal haalt uit Etta James' nummer Something's Got a Hold on Me uit 1962." } },
  { track: "Tha Crossroads", artist: "Bone Thugs-n-Harmony", year: 1996,
    answer: "The Isley Brothers — \"Make Me Say It Again Girl\"",
    distractors: ["The Isley Brothers — \"Voyage to Atlantis\"","The Stylistics — \"You Make Me Feel Brand New\"","The Dramatics — \"In the Rain\""],
    fact: { en: "The melody interpolates The Isley Brothers' 1975 ballad Make Me Say It Again Girl.", nl: "De melodie interpoleert The Isley Brothers' ballad Make Me Say It Again Girl uit 1975." } },
  { track: "Gin and Juice", artist: "Snoop Doggy Dogg", year: 1993,
    answer: "Slave — \"Watching You\"",
    distractors: ["Zapp — \"More Bounce to the Ounce\"","The Gap Band — \"Outstanding\"","Cameo — \"Candy\""],
    fact: { en: "Dr. Dre interpolated the chorus of Slave's 1980 funk track Watching You for the Gin and Juice hook.", nl: "Dr. Dre interpoleerde het refrein van Slave's funktrack Watching You uit 1980 voor de hook van Gin and Juice." } },
  { track: "You Are My High", artist: "Demon", year: 2000,
    answer: "The Gap Band — \"You Are My High\"",
    distractors: ["The Gap Band — \"Oops Upside Your Head\"","Zapp — \"More Bounce to the Ounce\"","Cameo — \"Candy\""],
    fact: { en: "The French house track You Are My High by Demon and Heartbreaker samples the Gap Band's 1979 funk song of the same name.", nl: "De Franse housetrack You Are My High van Demon en Heartbreaker samplet het gelijknamige funknummer van The Gap Band uit 1979." } },
  { track: "Intro", artist: "Alan Braxe & Fred Falke", year: 2000,
    answer: "The Jets — \"Crush on You\"",
    distractors: ["Shannon — \"Let the Music Play\"","The S.O.S. Band — \"Just Be Good to Me\"","Cherrelle — \"I Didn't Mean to Turn You On\""],
    fact: { en: "Alan Braxe and Fred Falke lifted the synth refrain of Intro from the 1985 pop-funk hit Crush on You by The Jets.", nl: "Alan Braxe en Fred Falke haalden het synthrefrein van Intro uit de popfunk-hit Crush on You van The Jets uit 1985." } },
  { track: "So Much Love to Give", artist: "Together", year: 2002,
    answer: "The Real Thing — \"Love's Such a Wonderful Thing\"",
    distractors: ["Tavares — \"Heaven Must Be Missing an Angel\"","Heatwave — \"Boogie Nights\"","The Trammps — \"Disco Inferno\""],
    fact: { en: "Together, the duo of Thomas Bangalter and DJ Falcon, built So Much Love to Give on a loop from The Real Thing's 1977 song Love's Such a Wonderful Thing.", nl: "Together, het duo van Thomas Bangalter en DJ Falcon, bouwde So Much Love to Give op een loop uit The Real Thing's nummer Love's Such a Wonderful Thing uit 1977." } },
  { track: "If I Ever Feel Better", artist: "Phoenix", year: 2000,
    answer: "Toshiyuki Honda — \"Lament\"",
    distractors: ["Roy Ayers — \"Everybody Loves the Sunshine\"","Bob James — \"Nautilus\"","Lonnie Liston Smith — \"Expansions\""],
    fact: { en: "Phoenix sampled the chord progression of Japanese jazz musician Toshiyuki Honda's 1979 track Lament for If I Ever Feel Better.", nl: "Phoenix samplede de akkoordprogressie uit Lament van de Japanse jazzmuzikant Toshiyuki Honda uit 1979 voor If I Ever Feel Better." } },
  { track: "Midnight in a Perfect World", artist: "DJ Shadow", year: 1996,
    answer: "David Axelrod — \"The Human Abstract\"",
    distractors: ["David McCallum — \"The Edge\"","Galt MacDermot — \"Coffee Cold\"","Ramsey Lewis — \"Les Fleurs\""],
    fact: { en: "DJ Shadow built Midnight in a Perfect World around the mournful piano of David Axelrod's The Human Abstract from his Songs of Innocence album.", nl: "DJ Shadow bouwde Midnight in a Perfect World rond de piano van David Axelrods The Human Abstract." } },
  { track: "Hell Is Round the Corner", artist: "Tricky", year: 1995,
    answer: "Isaac Hayes — \"Ike's Rap II\"",
    distractors: ["Barry White — \"I'm Gonna Love You Just a Little More Baby\"","Al Green — \"Love and Happiness\"","Curtis Mayfield — \"Move On Up\""],
    fact: { en: "Tricky's Hell Is Round the Corner uses the same Isaac Hayes Ike's Rap II loop that powers Portishead's Glory Box.", nl: "Tricky's Hell Is Round the Corner gebruikt dezelfde Isaac Hayes-loop als Portisheads Glory Box." } },
  { track: "Unfinished Sympathy", artist: "Massive Attack", year: 1991,
    answer: "Mahavishnu Orchestra — \"Planetary Citizen\"",
    distractors: ["Bob James — \"Nautilus\"","Lonnie Liston Smith — \"Expansions\"","Roy Ayers — \"Everybody Loves the Sunshine\""],
    fact: { en: "Unfinished Sympathy lifts the chanted hey-hey-hey vocal from the Mahavishnu Orchestra's Planetary Citizen.", nl: "Unfinished Sympathy gebruikt het gezongen hey-hey-hey uit Mahavishnu Orchestra's Planetary Citizen." } },
  { track: "Aftermath", artist: "Tricky", year: 1994,
    answer: "Marvin Gaye — \"That's the Way Love Is\"",
    distractors: ["Curtis Mayfield — \"Move On Up\"","Bill Withers — \"Use Me\"","Donny Hathaway — \"The Ghetto\""],
    fact: { en: "Tricky's Aftermath samples elements of Marvin Gaye's That's the Way Love Is.", nl: "Tricky's Aftermath gebruikt elementen van Marvin Gaye's That's the Way Love Is." } },
  { track: "Out of Time", artist: "The Weeknd", year: 2022,
    answer: "Tomoko Aran — \"Midnight Pretenders\"",
    distractors: ["Mariya Takeuchi — \"Plastic Love\"","Anri — \"Last Summer Whisper\"","Junko Ohashi — \"Telephone Number\""],
    fact: { en: "Out of Time is built on a sample of Japanese city pop singer Tomoko Aran's 1983 song Midnight Pretenders.", nl: "Out of Time is gebouwd op een sample van Midnight Pretenders uit 1983 van de Japanse city-popzangeres Tomoko Aran." } },
  { track: "Love Again", artist: "Dua Lipa", year: 2021,
    answer: "White Town — \"Your Woman\"",
    distractors: ["New Radicals — \"You Get What You Give\"","Republica — \"Ready to Go\"","Sneaker Pimps — \"6 Underground\""],
    fact: { en: "Love Again uses the lovelorn trumpet melody that White Town's 1997 hit Your Woman made famous; both songs draw on a 1932 Lew Stone recording, which is the source credited on Love Again.", nl: "Love Again gebruikt de droevige trompetmelodie die White Town's hit Your Woman uit 1997 beroemd maakte; beide nummers putten uit een opname van Lew Stone uit 1932, die op Love Again wordt gecrediteerd." } },
  { track: "WAP", artist: "Cardi B ft. Megan Thee Stallion", year: 2020,
    answer: "Frank Ski — \"Whores in This House\"",
    distractors: ["DJ Kool — \"Let Me Clear My Throat\"","95 South — \"Whoot, There It Is\"","Tag Team — \"Whoomp! (There It Is)\""],
    fact: { en: "The chant in WAP samples Baltimore club DJ Frank Ski's 1993 track Whores in This House.", nl: "De zang in WAP sampelt de track Whores in This House uit 1993 van de Baltimore-club-dj Frank Ski." } },
  { track: "Friday", artist: "Riton & Nightcrawlers ft. Mufasa & Hypeman", year: 2021,
    answer: "Nightcrawlers — \"Push the Feeling On\"",
    distractors: ["Robin S. — \"Show Me Love\"","CeCe Peniston — \"Finally\"","Livin' Joy — \"Dreamer\""],
    fact: { en: "Friday is a re-edit built on Nightcrawlers' 1992 house track Push the Feeling On, reworked into a viral dance hit.", nl: "Friday is een re-edit gebouwd op Nightcrawlers' housetrack Push the Feeling On uit 1992, omgewerkt tot een virale dancehit." } },
  { track: "Sacrifice", artist: "The Weeknd", year: 2022,
    answer: "Alicia Myers — \"I Want to Thank You\"",
    distractors: ["Evelyn King — \"Love Come Down\"","Cheryl Lynn — \"Got to Be Real\"","Stephanie Mills — \"Never Knew Love Like This Before\""],
    fact: { en: "Sacrifice samples the vocal and groove of Alicia Myers's 1981 boogie track I Want to Thank You.", nl: "Sacrifice sampelt de zang en groove van Alicia Myers' boogietrack I Want to Thank You uit 1981." } },
  { track: "Father Stretch My Hands Pt. 1", artist: "Kanye West", year: 2016,
    answer: "Pastor T.L. Barrett — \"Father I Stretch My Hands\"",
    distractors: ["The Staple Singers — \"I'll Take You There\"","Edwin Hawkins Singers — \"Oh Happy Day\"","Andraé Crouch — \"Soon and Very Soon\""],
    fact: { en: "Kanye opened the track with Pastor T.L. Barrett's 1976 gospel recording, helping revive interest in the Chicago preacher's choir work.", nl: "Kanye opent de track met de gospelopname van Pastor T.L. Barrett uit 1976, wat de interesse in het koorwerk van de Chicago-predikant deed herleven." } },
  { track: "Self Care", artist: "Mac Miller", year: 2018,
    answer: "Erykah Badu — \"On & On\"",
    distractors: ["Jill Scott — \"A Long Walk\"","D'Angelo — \"Brown Sugar\"","Lauryn Hill — \"Doo Wop (That Thing)\""],
    fact: { en: "The first half of Self Care, before the switch into Oblivion, samples Erykah Badu's 1997 neo-soul breakthrough On & On.", nl: "De eerste helft van Self Care, voor de overgang naar Oblivion, gebruikt On & On, de neo-soul doorbraak van Erykah Badu uit 1997." } },
  { track: "A Lot", artist: "21 Savage", year: 2018,
    answer: "East of Underground — \"I Love You\"",
    distractors: ["The Delfonics — \"La-La (Means I Love You)\"","The Stylistics — \"You Are Everything\"","The Chi-Lites — \"Oh Girl\""],
    fact: { en: "The 21 Savage and J. Cole track loops East of Underground's soul cover of I Love You for All Seasons, recorded by U.S. Army soldiers.", nl: "De track van 21 Savage en J. Cole loopt de soulcover van East of Underground, opgenomen door soldaten van het Amerikaanse leger." } },
  { track: "No More Parties in L.A.", artist: "Kanye West", year: 2016,
    answer: "Junie Morrison — \"Suzie Thundertussy\"",
    distractors: ["The Isley Brothers — \"Footsteps in the Dark\"","Marvin Gaye — \"Inner City Blues\"","Bobby Womack — \"Across 110th Street\""],
    fact: { en: "The beat by Madlib and Kanye for the Kanye and Kendrick track is built on Junie Morrison's 1976 funk-soul cut, with a sampled Larry Graham vocal.", nl: "De beat van Madlib en Kanye voor de track van Kanye en Kendrick leunt op de funk-soul plaat van Junie Morrison uit 1976, met een gesamplede Larry Graham-vocaal." } },
  { track: "Blessings (Reprise)", artist: "Chance the Rapper", year: 2016,
    answer: "Fred Hammond — \"Let the Praise Begin\"",
    distractors: ["Kirk Franklin — \"Stomp\"","The Clark Sisters — \"Is My Living in Vain\"","Marvin Sapp — \"Never Would Have Made It\""],
    fact: { en: "The closing track of Coloring Book interpolates Fred Hammond's gospel praise song, fitting Chance's overtly gospel album.", nl: "De afsluitende track van Coloring Book leunt op het gospelnummer van Fred Hammond, passend bij Chance's uitgesproken gospelalbum." } },
  { track: "4:44", artist: "JAY-Z", year: 2017,
    answer: "Hannah Williams & The Affirmations — \"Late Nights & Heartbreak\"",
    distractors: ["Sharon Jones & The Dap-Kings — \"100 Days, 100 Nights\"","Charles Bradley — \"The World (Is Going Up in Flames)\"","Lee Fields — \"Faithful Man\""],
    fact: { en: "No I.D. looped a long sample of the British soul band's 2016 track for Jay-Z's apologetic title song.", nl: "No I.D. loopte een lang fragment van de track van de Britse soulband uit 2016 voor Jay-Z's verontschuldigende titelsong." } },
  { track: "Smile", artist: "JAY-Z", year: 2017,
    answer: "Stevie Wonder — \"Love's in Need of Love Today\"",
    distractors: ["Bill Withers — \"Lovely Day\"","Donny Hathaway — \"Someday We'll All Be Free\"","Al Green — \"Love and Happiness\""],
    fact: { en: "The track samples the opening cut from Stevie Wonder's 1976 album Songs in the Key of Life and features Jay-Z's mother Gloria Carter.", nl: "De track gebruikt het openingsnummer van Stevie Wonders album Songs in the Key of Life uit 1976 en bevat Jay-Z's moeder Gloria Carter." } },
  { track: "Need U (100%)", artist: "Duke Dumont", year: 2013,
    answer: "Reese — \"Just Want Another Chance\"",
    distractors: ["Mr. Fingers — \"Can You Feel It\"","Phuture — \"Acid Tracks\"","Frankie Knuckles — \"Your Love\""],
    fact: { en: "Duke Dumont's Need U (100%) reuses the rolling bassline from Reese's 1988 Detroit techno cut Just Want Another Chance.", nl: "Need U (100%) van Duke Dumont hergebruikt de rollende basline uit Just Want Another Chance van Reese uit 1988." } },
  { track: "Cry (Just a Little)", artist: "Bingo Players", year: 2011,
    answer: "Brenda Russell — \"Piano in the Dark\"",
    distractors: ["Anita Baker — \"Sweet Love\"","Sade — \"Smooth Operator\"","Patrice Rushen — \"Forget Me Nots\""],
    fact: { en: "Bingo Players looped the \"I cry just a little\" line from Brenda Russell's 1988 ballad Piano in the Dark.", nl: "Bingo Players loopten de regel \"I cry just a little\" uit de ballad Piano in the Dark van Brenda Russell uit 1988." } },
  { track: "Temperature", artist: "Sean Paul", year: 2005,
    answer: "Rohan \"Snowcone\" Fuller — \"Applause Riddim\"",
    distractors: ["Steven \"Lenky\" Marsden — \"Diwali Riddim\"","Dave Kelly — \"Bookshelf Riddim\"","Don Corleon — \"Drop Leaf Riddim\""],
    fact: { en: "Temperature is built on the Applause riddim produced by Jamaican producer Rohan Snowcone Fuller.", nl: "Temperature is gebouwd op de Applause riddim, geproduceerd door de Jamaicaanse producer Rohan Snowcone Fuller." } },
  { track: "Lean On", artist: "Major Lazer and DJ Snake feat. MØ", year: 2015,
    answer: "Taxi Gang — \"Santa Barbara\"",
    distractors: ["Sly & Robbie — \"Boops\"","Steely & Clevie — \"Poco Man Jam\"","Mad Cobra — \"Flex\""],
    fact: { en: "Lean On interpolates the melody of Santa Barbara by Sly and Robbie's Taxi Gang, a riddim rooted in Jamaican dancehall production.", nl: "Lean On interpoleert de melodie van Santa Barbara van Sly en Robbie's Taxi Gang, een riddim uit de Jamaicaanse dancehallproductie." } },
  { track: "Bruk Off Yuh Back", artist: "Konshens", year: 2016,
    answer: "Birchill — \"Moskato Riddim\"",
    distractors: ["Di Genius — \"Hot Wuk Riddim\"","ZJ Chrome — \"Stink Behaviour Riddim\"","Rvssian — \"Overproof Riddim\""],
    fact: { en: "Bruk Off Yuh Back rides Birchill's Moskato riddim, a 2016 dancehall instrumental produced by Christopher Birch.", nl: "Bruk Off Yuh Back rijdt op Birchills Moskato riddim, een dancehall-instrumental uit 2016 geproduceerd door Christopher Birch." } },
  { track: "Never Leave You (Uh Oooh, Uh Oooh)", artist: "Lumidee", year: 2003,
    answer: "Steven \"Lenky\" Marsden — \"Diwali Riddim\"",
    distractors: ["Jeremy Harding — \"2 Hard Riddim\"","Dave Kelly — \"Pepperseed Riddim\"","Steely & Clevie — \"Bookshelf Riddim\""],
    fact: { en: "Never Leave You rides the Diwali riddim by Steven Lenky Marsden, one of three Diwali tracks in the 2003 Billboard top twenty.", nl: "Never Leave You rijdt op de Diwali riddim van Steven Lenky Marsden, een van drie Diwali-nummers in de Billboard top twintig van 2003." } },
  { track: "Suga Mama", artist: "Beyoncé", year: 2006,
    answer: "Jake Wade and the Soul Searchers — \"Searching for Soul\"",
    distractors: ["The Meters — \"Cissy Strut\"","The J.B.'s — \"Pass the Peas\"","Kool & the Gang — \"Who's Gonna Take the Weight\""],
    fact: { en: "Producer Rich Harrison built Suga Mama around the guitar and groove of Jake Wade and the Soul Searchers' jazz-funk instrumental Searching for Soul.", nl: "Producer Rich Harrison bouwde Suga Mama rond de gitaar en groove van het jazz-funkinstrumentaal Searching for Soul van Jake Wade and the Soul Searchers." } },
  { track: "Be Happy", artist: "Mary J. Blige", year: 1994,
    answer: "Curtis Mayfield — \"You're So Good to Me\"",
    distractors: ["Curtis Mayfield — \"Move On Up\"","Curtis Mayfield — \"Pusherman\"","The Impressions — \"People Get Ready\""],
    fact: { en: "Be Happy samples the instrumental of Curtis Mayfield's 1979 song You're So Good to Me, with a re-sung line from Marvin Gaye's I Want You.", nl: "Be Happy sampelt het instrumentaal van Curtis Mayfields nummer You're So Good to Me uit 1979, met een opnieuw ingezongen regel uit Marvin Gayes I Want You." } },
  { track: "Déjà Vu", artist: "Beyoncé", year: 2006,
    answer: "B.T. Express — \"Do It ('Til You're Satisfied)\"",
    distractors: ["B.T. Express — \"Express\"","The Fatback Band — \"(Are You Ready) Do the Bus Stop\"","Brass Construction — \"Movin'\""],
    fact: { en: "Rodney Jerkins built Déjà Vu around a sample of B.T. Express' 1974 funk track Do It ('Til You're Satisfied).", nl: "Rodney Jerkins bouwde Déjà Vu rond een sample van B.T. Express' funktrack Do It ('Til You're Satisfied) uit 1974." } },
  { track: "Firestarter", artist: "The Prodigy", year: 1996,
    answer: "The Breeders — \"S.O.S.\"",
    distractors: ["Pixies — \"Where Is My Mind?\"","Sonic Youth — \"Kool Thing\"","Nine Inch Nails — \"Head Like a Hole\""],
    fact: { en: "The looped wah-wah guitar riff is sampled from the Breeders' S.O.S., layered with the \"hey\" stab from Art of Noise's Close (to the Edit).", nl: "De geloopte wah-wah-gitaarriff is gesampled van de Breeders' S.O.S., gecombineerd met de \"hey\" uit Art of Noise's Close (to the Edit)." } },
  { track: "Girlfriend", artist: "Avril Lavigne", year: 2007,
    answer: "The Rubinoos — \"I Wanna Be Your Boyfriend\"",
    distractors: ["The Knack — \"My Sharona\"","The Romantics — \"What I Like About You\"","Cheap Trick — \"I Want You to Want Me\""],
    fact: { en: "The Rubinoos sued over the chorus's resemblance to their 1979 power-pop song; the case was settled out of court.", nl: "De Rubinoos klaagden over de gelijkenis van het refrein met hun powerpopnummer uit 1979; de zaak werd buiten de rechter geschikt." } },
  { track: "Your Woman", artist: "White Town", year: 1997,
    answer: "Al Bowlly with Lew Stone — \"My Woman\"",
    distractors: ["Bing Crosby — \"Pennies from Heaven\"","Fats Waller — \"Ain't Misbehavin'\"","Hoagy Carmichael — \"Stardust\""],
    fact: { en: "The signature trumpet riff is sampled from a 1932 recording of My Woman by Lew Stone's band featuring Al Bowlly.", nl: "De kenmerkende trompetriff is gesampled van een opname uit 1932 van My Woman door de band van Lew Stone met Al Bowlly." } },
  { track: "Ray of Light", artist: "Madonna", year: 1998,
    answer: "Curtiss Maldoon — \"Sepheryn\"",
    distractors: ["Fairport Convention — \"Who Knows Where the Time Goes\"","Pentangle — \"Light Flight\"","The Incredible String Band — \"October Song\""],
    fact: { en: "The song is built on the British folk duo's 1971 track Sepheryn, with Curtiss and Maldoon credited as co-writers.", nl: "Het nummer is gebouwd op Sepheryn uit 1971 van het Britse folkduo; Curtiss en Maldoon staan als medeschrijvers vermeld." } },
  { track: "Right Here, Right Now", artist: "Fatboy Slim", year: 1999,
    answer: "The James Gang — \"Ashes, the Rain and I\"",
    distractors: ["Free — \"All Right Now\"","Mountain — \"Mississippi Queen\"","Grand Funk Railroad — \"We're an American Band\""],
    fact: { en: "The rising string melody is sampled from the James Gang's 1970 song, paired with an Angela Bassett line from the film Strange Days.", nl: "De stijgende strijkersmelodie is gesampled van een nummer van de James Gang uit 1970, met een zin van Angela Bassett uit de film Strange Days." } },
  { track: "Needin' U", artist: "David Morales", year: 1998,
    answer: "Rare Pleasure — \"Let Me Down Easy\"",
    distractors: ["First Choice — \"Let No Man Put Asunder\"","Loleatta Holloway — \"Hit and Run\"","The Salsoul Orchestra — \"Ooh I Love It (Love Break)\""],
    fact: { en: "David Morales' Needin' U is built on a looped piano sample from Rare Pleasure's 1976 soul track Let Me Down Easy.", nl: "David Morales' Needin' U is gebouwd op een geloopte pianosample uit Rare Pleasures soulnummer Let Me Down Easy uit 1976." } },
  { track: "Hey Ya!", artist: "OutKast", year: 2003,
    answer: "André 3000 — \"Hey Ya!\"",
    distractors: ["Sam Cooke — \"Twistin' the Night Away\"","Otis Redding — \"Try a Little Tenderness\"","The Isley Brothers — \"Shout\""],
    fact: { en: "Hey Ya! is an original composition by André 3000 and contains no sample, despite its retro 60s soul feel.", nl: "Hey Ya! is een originele compositie van André 3000 en bevat geen sample, ondanks de retro 60s-soulsfeer." } },
  { track: "All the Parties", artist: "Drake", year: 2023,
    answer: "Pet Shop Boys — \"West End Girls\"",
    distractors: ["New Order — \"Blue Monday\"","Yazoo — \"Situation\"","Bronski Beat — \"Smalltown Boy\""],
    fact: { en: "Drake's All the Parties sings the chorus line of Pet Shop Boys' 1984 synth-pop classic West End Girls, which the duo publicly said was used without credit or permission.", nl: "Drake's All the Parties zingt de refreinregel van Pet Shop Boys' synth-popklassieker West End Girls uit 1984, waarvan het duo publiekelijk zei dat die zonder credit of toestemming werd gebruikt." } },
  { track: "Destination Calabria", artist: "Alex Gaudino", year: 2007,
    answer: "Rune RK — \"Calabria\"",
    distractors: ["Eric Prydz — \"Pjanoo\"","Benny Benassi — \"Satisfaction\"","Bodyrox — \"Yeah Yeah\""],
    fact: { en: "Destination Calabria fuses the saxophone riff from Rune RK's 2003 instrumental Calabria with Crystal Waters' vocal from Destination Unknown.", nl: "Destination Calabria combineert de saxofoonriff uit Rune RK's instrumentale Calabria uit 2003 met Crystal Waters' zang uit Destination Unknown." } },
  { track: "Like a G6", artist: "Far East Movement", year: 2010,
    answer: "Dev & The Cataracs — \"Booty Bounce\"",
    distractors: ["Yelle — \"Je veux te voir\"","Uffie — \"Pop the Glock\"","Annie — \"Chewing Gum\""],
    fact: { en: "Like a G6 is built directly on the hook and beat of Dev and The Cataracs' 2010 track Booty Bounce, with Dev's vocal forming the song's signature line.", nl: "Like a G6 is rechtstreeks gebouwd op de hook en beat van Dev en The Cataracs' track Booty Bounce uit 2010, waarbij Devs zang de kenmerkende regel vormt." } },
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
