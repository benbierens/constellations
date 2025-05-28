using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Prototyping
{
    public class ContentStarExample
    {
        private readonly byte[] TarOfSeveralPhotos = new byte[1];
        private readonly byte[] TarOfEvenMorePhotos = new byte[1];

        /// <summary>
        /// ContentStars are not supposed to be used in isolation.
        /// This is to demonstrate what they can do.
        /// </summary>
        public void Example()
        {
            // I'm running a constellation node.
            // I'm setting up a single star to share a tarred folder of photos with a friend.

            // My constellation node comes with an id:
            var myNodeId = new ConstellationNodeId();

            // Setting up the star:
            var id = new StarId();
            var info = new StarInfo(id)
            {
                Owners = [myNodeId], // I'm the owner. I can appoint/revoke Controllers. But Owners cannot be edited after creation.
                Type = "content_tarred_photos" // Something the app built on top of Constellations will understand.
            };
            var star = new ContentStar(info);
            // star.Properties can be edited later.
            star.Properties.Status = StarStatus.Bright; // This means the content is relevant and support for this star is wanted.
            star.Properties.Controllers = []; // I don't assign anyone else the ability to edit this data.

            // Push my data.
            star.Put(new ContentStar.DataSpan
            {
                // Inserting data from zero
                Offset = 0,
                Length = 0
            }, TarOfSeveralPhotos);


            // My friend also has a constellation node:
            var friendNodeId = new ConstellationNodeId();

            // I give the starId to my friend.
            // On their constellation node:
            {
                var friendStar = new ContentStar(new StarInfo(id));
                var propertiesChangedHandler = new Star.PropertiesChangeHandler();
                var contentChangedHandler = new ContentStar.ContentChangeHandler();

                // Can view the photos
                var bytes = friendStar.Get(new ContentStar.DataSpan());

                // Can stay up-to-date
                friendStar.SubscribeToPropertiesChanges(propertiesChangedHandler);
                friendStar.SubscribeToContentChanges(contentChangedHandler);
            }


            // Some time later, I push an update.
            star.Put(new ContentStar.DataSpan
            {
                // Replacing the whole thing
                Offset = 0,
                Length = TarOfSeveralPhotos.Length
            }, TarOfEvenMorePhotos);


            // On my friend's node:
            {
                // content-changed-handler is fired.
            }


            // Some time later, I want to give my friend the ability to modify the tar
            // So they can add some photos of their own.
            // On my constellation node:
            {
                star.Properties.Controllers = [friendNodeId];
            }

            // This causes, on friend's node:
            {
                // property-changed-handler is fired.
                // Because they are now in the controllers list, changes signed by their key will be accepted by other nodes.
            }
        }
    }
}

