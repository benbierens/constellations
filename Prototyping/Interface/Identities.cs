namespace Prototyping.Interface
{
    public class ConstellationNodeId
    {
        public string PublicKey = "public-key";
        private string PrivateKey = "I can use this to sign messages";
    }

    public class StarId
    {
        public string Id = "Hash of starInfo";
        public string WakuContentTopic => IdAsContentTopic();

        private string IdAsContentTopic()
        {
            // something like
            return $"constellations/v0/{Id}";
        }
    }

    public class ConstellationId : StarId { }
}
