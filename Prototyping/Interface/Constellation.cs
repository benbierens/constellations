using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Prototyping.Interface
{
    public class Constellation
    {
        // Basically, a constellation is just a wrapper around a metaStar.
        private readonly MetaStar topLevelMetaStar;

        public static Constellation CreateNew(StarInfo info)
        {
            // When setting up a new constellation, the info
            // for the top-level metaStar must be provided.
            return new Constellation(info);
        }

        public static Constellation CreateToSupport(ConstellationId id)
        {
            // When trying to follow/support a constellation
            // you only need the id.
            return new Constellation(id);
        }

        public Constellation(StarInfo info)
        {
            topLevelMetaStar = new MetaStar(info);
        }

        private Constellation(ConstellationId id)
        {
            var fetchedStarInfo = StarInfo.FetchUsingId(id);
            topLevelMetaStar = new MetaStar(fetchedStarInfo);
        }

        public StarProperties Properties => topLevelMetaStar.Properties;

        public StarInfo? Get(string path)
        {
            // we ask the top-level metaStar for this path.
            // maybe, part of the path points us to another metaStar, for example:
            // path = "/game/content/models/vehicles"
            // the top-level metaStar only has an entry for "/game/content",
            // we fetch it, it's another metaStar.
            // we ask it for "/models/vehicles" and it returns a contentStar info.
            return null;
        }

        public string[] List(string path)
        {
            // Lists all paths immediately under the given path.
            // example:
            // path = "/game/content"
            // result = ["/game/content/models", "/game/content/audio", "game/content/scripts"]
            // any of these paths may contain any number of multiple sub-paths. Those are not returned.

            return [];
        }

        public void Put(string path, StarInfo star)
        {
            // Following the same logic, we put the star info into the correct metaStar
        }

        public void Remove(string path)
        {
            // Again, traverse the metaStars where needed.
        }
    }
}
