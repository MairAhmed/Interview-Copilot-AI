"""
Golden test transcripts for eval suite.
Three candidates: STRONG, AVERAGE, WEAK.
Expected score ordering: STRONG > AVERAGE > WEAK for all dimensions.
"""

STRONG = """
Interviewer: Explain the difference between a stack and a queue, with real-world examples.

Candidate: A stack is LIFO — last in, first out. The last element pushed is the first popped.
A queue is FIFO — first in, first out. Classic example: a printer job queue processes
documents in the order they arrive. For a stack, think of the browser back-button history —
each page visited is pushed onto the stack, and hitting back pops the most recent.
Time complexity for both push and pop on a stack backed by a dynamic array is O(1) amortized.

Interviewer: How does a hash map work internally?

Candidate: A hash map uses a hash function to map keys to indices in an underlying array.
On insertion, the key is hashed to produce a bucket index, and the key-value pair is stored
there. Collisions — where two keys hash to the same index — are handled via chaining, which
stores a linked list at each bucket, or open addressing, which probes for the next free slot.
Average-case lookup, insert, and delete are all O(1). Worst case is O(n) when all keys
collide into one bucket, which is why a good hash function and load factor management matter.
Most implementations resize — rehash everything — when the load factor exceeds a threshold,
typically 0.75.

Interviewer: Design a URL shortener at scale.

Candidate: I'd break it into three core components: the encoding service, the data store,
and the redirect layer. For encoding, base-62 with 7 characters gives us 62^7 — about 3.5
trillion unique URLs, more than enough. On write, I generate the short code, check for
collisions in the store, and persist the mapping with a TTL field for expiration. For the
data store, I'd use a key-value store like DynamoDB for sub-millisecond lookups, with the
short code as the partition key. The redirect path needs to be extremely fast, so I'd put
Redis in front as a write-through cache — popular links are served from memory without
hitting the database. For custom aliases, users can specify their own slug; I validate
uniqueness before writing. Edge cases to handle: duplicate long URLs, expired TTLs,
collision on custom slugs, and abuse prevention via rate limiting on the write endpoint.
The main trade-off in my design is that write throughput is limited by the central DB,
but reads scale horizontally behind the cache layer.
"""

AVERAGE = """
Interviewer: Explain the difference between a stack and a queue, with real-world examples.

Candidate: Um, so a stack and a queue are both like data structures. I think a stack is
like LIFO, which is last in first out? And a queue is FIFO. Like, I think an example of
a queue would be like a line at a store. And a stack would be like, I think it's like
browser history or something like that. They both store elements but the order you get
them out is different.

Interviewer: How does a hash map work internally?

Candidate: A hash map basically uses a hash function to convert keys to indices. So when
you add something, it hashes the key and stores the value at that index in an array.
The issue is collisions, where two keys go to the same spot. I think there are a few ways
to handle it — I know chaining uses a linked list at each bucket. Lookup is usually constant
time which is why hash maps are so useful. I guess in bad cases it could be slower but
normally it's fast.

Interviewer: Design a URL shortener at scale.

Candidate: Okay so for a URL shortener you need to take a long URL and give back a short
code. I'd probably hash the URL to generate the code. You'd store the mapping in a database
and when someone visits the short URL you look it up and redirect them. I'd add a cache for
popular URLs so you're not hitting the database every time. I think that covers the main
parts. You'd probably also want some way to handle if a lot of people are using it at once
but I'm not totally sure on the details of that.
"""

WEAK = """
Interviewer: Explain the difference between a stack and a queue, with real-world examples.

Candidate: I think a stack is like... it stores data? And a queue is similar I think.
I'm not really sure of the exact difference off the top of my head. I think maybe a stack
is like LIFO but I'm not sure if that's right. I guess a real world example would be
like... storing files? I'm not totally sure, I'd have to think about it more.

Interviewer: How does a hash map work internally?

Candidate: Um, I think a hash map is like a dictionary. You store key-value pairs.
I'm not sure exactly how it works internally, like I know you can look things up fast
but I'm not sure why. I think there's something called hashing but I don't really
remember the details. I guess it's just like a built-in data structure that's efficient.

Interviewer: Design a URL shortener at scale.

Candidate: I think you'd have like a database that maps short URLs to long ones. And when
someone clicks the short URL it looks up the long one and redirects. I'm not sure how you'd
make it scale, like I'd have to think about that. I guess you could use a faster database
or something. I'm not really sure about the design details, I haven't done much system
design before. Maybe you'd need multiple servers?
"""

TRANSCRIPTS = {
    "strong": STRONG,
    "average": AVERAGE,
    "weak": WEAK,
}

# Expected score ranges for each transcript
EXPECTED = {
    "strong":  {"overall": (7.5, 10.0), "technical": (7.5, 10.0), "communication": (7.0, 10.0), "confidence": (7.0, 10.0)},
    "average": {"overall": (5.0,  7.5), "technical": (5.0,  7.5), "communication": (4.5,  7.5), "confidence": (4.0,  7.0)},
    "weak":    {"overall": (1.0,  5.0), "technical": (1.0,  5.0), "communication": (1.0,  5.5), "confidence": (1.0,  5.0)},
}
